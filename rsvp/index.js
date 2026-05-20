const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    // 1. Gracefully catch missing connection strings without crashing the server
    if (!connectionString) {
        context.res = { 
            status: 500, 
            body: "Error: AZURE_STORAGE_CONNECTION_STRING is unconfigured in the Azure Environment Variables." 
        };
        return;
    }

    // 2. Only initialize the table client AFTER verifying the string exists
    const tableClient = TableClient.fromConnectionString(connectionString, "rsvps");

    try {
        if (req.method === 'POST') {
            const data = req.body;
            if (!data || !data.name) {
                context.res = { status: 400, body: "Malformed submission data payload." };
                return;
            }

            const cleanRowKey = data.name.replace(/([\/\\?#\t\n\r])/g, "").trim();

            const entity = {
                partitionKey: "Graduation2026",
                rowKey: cleanRowKey,
                email: data.email || "",
                attending: data.attending || "No",
                guests: data.guests || "0",
                dietary: data.dietary || ""
            };

            await tableClient.createEntity(entity);
            context.res = { status: 200, body: "RSVP submitted successfully!" };

        } else if (req.method === 'GET') {
            const entities = [];
            const iterator = tableClient.listEntities();
            
            for await (const entity of iterator) {
                entities.push(entity);
            }

            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: entities
            };
        }
    } catch (error) {
        context.log("Database Error:", error.message);
        context.res = { status: 500, body: "Internal Server Database Error: " + error.message };
    }
};
