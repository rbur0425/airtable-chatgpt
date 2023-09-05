// Setup
const apiKey = 'sk-XXXX'; //Change API-Key
const url = 'https://api.openai.com/v1/chat/completions';
const model = 'gpt-3.5-turbo';

// Function to generate GPT response
async function generateGPTResponse(prompt) {
    const request = {
        model: model,
                    messages: [{ "role": "user", "content": prompt }],
                    temperature: 0.8,
                    top_p: 1,
                    max_tokens: 256,
                    frequency_penalty: 0,
                    presence_penalty: 0
    };

    const headers = {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request)
    });

    return await response.json();
}

// Get the prompts table
let table = base.getTable("Prompts");

// Prompt the user to pick a record
let selectedRecord = await input.recordAsync('Select a record to start processing from', table);

if (!selectedRecord) {
    output.text('No record was selected');
    return;
}

// Fetch all records
let queryResult = await table.selectRecordsAsync();
let records = queryResult.records;
let recordIndex = records.findIndex(record => record.id === selectedRecord.id);

// Fetch field names from the table
let fieldNames = table.fields.map(field => field.name); // Adjusted this line

// Begin processing the prompts for each record starting from the selected record
for (let i = recordIndex; i < records.length; i++) {
    let currentRecord = records[i];
    for (let fieldName of fieldNames) {
        if (fieldName.startsWith("Prompt ") && !fieldName.includes("Output")) {
            let prompt = currentRecord.getCellValue(fieldName);
            if (prompt) {
                // Adjust the outputFieldName according to your naming convention
                let outputFieldName = `${fieldName} Output`;

                let response = await generateGPTResponse(prompt);
                let output = response.choices[0].message.content;

                await table.updateRecordAsync(currentRecord, {
                    [outputFieldName]: output
                });
            }
        }
    }
    // Marking the Status as Done after processing all prompts for a record
    await table.updateRecordAsync(currentRecord, {
        "Status": {name: "Done"}
    });
}

output.text("All prompts have been processed!");
