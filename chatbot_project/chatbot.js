
// --- IMPORTANT: API Key Configuration ---
// Replace the placeholder string with your actual Google AI API key.
// WARNING: For production, it's highly recommended to use a backend proxy 
// to keep your API key secure, instead of exposing it in client-side code.
const apiKey = "YOUR_GOOGLE_AI_API_KEY";

// --- State Variables ---
let generatedSchema = ''; // Holds the schema for the AI prompt
let tableName = ''; // Holds the name of the table derived from the CSV filename
let csvData = []; // Holds the parsed CSV data for AlaSQL
let chartInstance = null; // Holds the Chart.js instance

// --- Element References ---
const generateBtn = document.getElementById('generateBtn');
const questionInput = document.getElementById('question');
const csvUpload = document.getElementById('csv-upload');
const fileInfo = document.getElementById('file-info');
const outputContainer = document.getElementById('output-container');
const outputCode = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const copyFeedback = document.getElementById('copy-feedback');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const loader = document.getElementById('loader');
const btnText = document.getElementById('btn-text');
const chartContainer = document.getElementById('chart-container');
const chartCanvas = document.getElementById('result-chart');

// --- Event Listener for File Upload ---
csvUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        fileInfo.classList.add('hidden');
        generatedSchema = '';
        csvData = [];
        tableName = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.trim().split('\n');
        if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            tableName = file.name.replace('.csv', '').replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize table name

            // Parse CSV data into an array of objects
            csvData = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((header, i) => {
                    const value = values[i] ? values[i].trim().replace(/"/g, '') : '';
                    obj[header] = isNaN(Number(value)) || value === '' ? value : Number(value);
                });
                return obj;
            });
            
            generatedSchema = `Table Name: ${tableName}\nColumns: ${headers.join(', ')}`;
            
            fileInfo.innerHTML = `<strong>File Loaded:</strong> ${file.name}<br><strong>Detected Columns:</strong> ${headers.join(', ')}`;
            fileInfo.classList.remove('hidden');
            hideError();
        } else {
            showError("The uploaded CSV file appears to be empty or has no data rows.");
            generatedSchema = '';
            csvData = [];
        }
    };
    reader.onerror = () => {
        showError("Failed to read the uploaded file.");
        generatedSchema = '';
        csvData = [];
    };
    reader.readAsText(file);
});

// --- Event Listener for the Generate Button ---
generateBtn.addEventListener('click', async () => {
    const question = questionInput.value.trim();

    if (apiKey === "YOUR_GOOGLE_AI_API_KEY") {
        showError("Please set your Google AI API key in the script.js file.");
        return;
    }
    if (!generatedSchema || csvData.length === 0) {
        showError("Please upload a valid CSV file first.");
        return;
    }
    if (!question) {
        showError("Please enter your question.");
        return;
    }

    setLoading(true);
    hideError();
    outputContainer.classList.add('hidden');
    chartContainer.classList.add('hidden');

    try {
        const prompt = `
            Based on the following database schema, write a standard SQL query that answers the user's question.
            Only return the SQL query and nothing else. Do not add any explanation or markdown formatting like \`\`\`sql.

            Schema:
            ${generatedSchema}

            Question:
            ${question}

            SQL Query:
        `;
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API request failed: ${errorBody.error?.message || response.status}`);
        }
        
        const result = await response.json();

        if (result.candidates && result.candidates.length > 0) {
            let sqlQuery = result.candidates[0].content.parts[0].text;
            sqlQuery = sqlQuery.replace(/```sql/g, '').replace(/```/g, '').trim();

            outputCode.textContent = sqlQuery;
            outputContainer.classList.remove('hidden');

            executeQueryAndVisualize(sqlQuery);
        } else {
            throw new Error("The AI returned an empty or invalid response.");
        }

    } catch (error) {
        console.error("Error:", error);
        showError(error.message || "An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
});

// --- Function to execute SQL and visualize the result ---
function executeQueryAndVisualize(sqlQuery) {
    try {
        const tableNameRegex = new RegExp(`\\b${tableName}\\b`, 'ig');
        const modifiedQuery = sqlQuery.replace(tableNameRegex, '?');
        const res = alasql(modifiedQuery, [csvData]);

        if (res && res.length > 0) {
            generateChart(res);
        } else {
            console.log("Query returned no data to visualize.");
            chartContainer.classList.add('hidden');
        }

    } catch (e) {
        console.error("AlaSQL Error:", e);
        showError(`Failed to execute the generated query on your data. Error: ${e.message}`);
    }
}

// --- Function to generate a chart from data ---
function generateChart(data) {
    const headers = Object.keys(data[0]);
    if (headers.length < 2) {
        console.log("Query result does not have enough columns for a chart.");
        chartContainer.classList.add('hidden');
        return;
    }

    const labels = data.map(row => row[headers[0]]);
    const values = data.map(row => parseFloat(row[headers[1]]));

    if (values.some(isNaN)) {
        console.log("Second column is not consistently numeric. Cannot generate bar chart.");
        chartContainer.classList.add('hidden');
        return;
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartContainer.classList.remove('hidden');
    const ctx = chartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: headers[1],
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true } },
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// --- Event Listener for the Copy Button ---
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputCode.textContent).then(() => {
        copyFeedback.classList.remove('hidden');
        setTimeout(() => copyFeedback.classList.add('hidden'), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showError("Failed to copy text to clipboard.");
    });
});

// --- Utility Functions ---
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    loader.style.display = isLoading ? 'inline-block' : 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
}

function hideError() {
    errorContainer.classList.add('hidden');
}
