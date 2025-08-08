# 🤖 AI SQL Query Generator

A simple web application that takes a CSV file and a plain English question, then uses the Google Gemini API to generate the corresponding SQL query and visualize the result.

## ✨ Features

- **Upload CSV:** Easily upload your own dataset in CSV format.
- **Natural Language Input:** Ask questions about your data in plain English (e.g., "show me the average salary by department").
- **AI-Powered SQL Generation:** Uses the Gemini 1.5 Flash model to convert your question into a valid SQL query.
- **In-Browser Query Execution:** Runs the generated query against your data directly in the browser using AlaSQL.js.

## 🛠️ Setup and Usage

Follow these steps to get the project running on your local machine.
1. Clone the Repository
2. Get Your API Key
This project requires a Google AI API key to function.

Visit Google AI Studio to create your API key.

Copy the generated API key.

3. Configure the API Key
Open the script.js file in your code editor.

Find the following line at the top of the file:

JavaScript

const apiKey = "YOUR_GOOGLE_AI_API_KEY";
Replace "YOUR_GOOGLE_AI_API_KEY" with the actual key you copied from Google AI Studio.

🔒 Security Warning:
Never commit your API key to a public repository. The method used in this project (placing the key in client-side JavaScript) is for demonstration purposes only. In a production environment, you should use a backend server to act as a proxy, keeping your API key secure.

4. Run the Application
No special server is needed. Simply open the index.html file in your favorite web browser.

🚀 How It Works
File Upload: When a user uploads a CSV, the browser reads its headers and data using JavaScript's FileReader API. The filename and column names are stored to create a schema.

Prompt Engineering: The schema, along with the user's English question, is formatted into a specific prompt for the Gemini language model.

API Call: A fetch request is sent to the Google Gemini API with the prompt.

Query Execution: The AI returns an SQL query as a string. This query is then executed on the stored CSV data using AlaSQL.js, a JavaScript SQL database.

Visualization: If the query returns data, Chart.js is used to render a bar chart, using the first column for labels and the second for values.

📦 Dependencies
This project runs entirely in the browser using the following libraries delivered via CDN:

Tailwind CSS for styling.
Chart.js for data visualization.
AlaSQL.js for in-browser SQL database capabilities.


<img width="670" height="505" alt="Screenshot 2025-08-09 011802" src="https://github.com/user-attachments/assets/de229e4e-34de-45b1-8927-0a9c994e6121" />
