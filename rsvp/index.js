const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableClient = TableClient.fromConnectionString(connectionString, "rsvps");

module.exports = async function (context, req) {
    if (!connectionString) {
        context.res = { status: 500, body: "Error: AZURE_STORAGE_CONNECTION_STRING is unconfigured." };
        return;
    }

    try {
        if (req.method === 'POST') {
            const data = req.body;
            if (!data || !data.name) {
                context.res = { status: 400, body: "Malformed submission data payload." };
                return;
            }

            const cleanRowKey = data.name.replace(/[\/\?#\\\t\n\r]/g, "").trim();

            const entity = {
                partitionKey: "Graduation2026",
                rowKey: cleanRowKey,
                name: data.name,
                attending: data.attending,
                chicken: data.chicken || "—",
                side: data.side || "—",
                drink: data.drink || "—",
                dietary: data.dietary || "—",
                timestamp: new Date().toISOString()
            };

            await tableClient.upsertEntity(entity, "Replace");
            context.res = { status: 201, body: { success: true } };

        } else if (req.method === 'GET') {
            const list = [];
            const entities = tableClient.listEntities({
                queryOptions: { filter: "PartitionKey eq 'Graduation2026'" }
            });

            for await (const entity of entities) {
                list.push({
                    name: entity.name,
                    attending: entity.attending,
                    chicken: entity.chicken,
                    side: entity.side,
                    drink: entity.drink,
                    dietary: entity.dietary
                });
            }

            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: list
            };
        }
    } catch (error) {
        context.log.error("Storage transactional update execution failed:", error);
        context.res = { status: 500, body: `Internal Server Fault: ${error.message}` };
    }
};
