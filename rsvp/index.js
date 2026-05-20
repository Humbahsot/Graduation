const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableClient = TableClient.fromConnectionString(connectionString, "rsvps");

module.exports = async function (context, req) {
    if (!connectionString) {
        context.res = { status: 500, body: "Error: AZURE_STORAGE_CONNECTION_STRING is unconfigured." };
        return;
    }

    try {
        // GET Request: Fetch all RSVPs for the dashboard
        if (req.method === 'GET') {
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
            return;
        }

        // POST Request: Process and save new RSVP submission
        if (req.method === 'POST') {
            const data = req.body;
            if (!data || !data.name) {
                context.res = { status: 400, body: "Malformed submission data payload." };
                return;
            }

            const cleanRowKey = data.name.replace(/[\/\\?#\t\n\r]/g, "").trim();

            const entity = {
                partitionKey: "Graduation2026",
                rowKey: cleanRowKey,
                name: data.name,
                attending: data.attending,
                chicken: data.chicken || "—",
                side: data.side || "—",
                drink: data.drink || "—",
                dietary: data.dietary || "—"
            };

            await tableClient.upsertEntity(entity, "Replace");
            context.res = { status: 200, body: "RSVP recorded successfully." };
            return;
        }
    } catch (err) {
        context.log.error("Storage tier fault context:", err);
        context.res = { status: 500, body: `Execution fault: ${err.message}` };
    }
};
