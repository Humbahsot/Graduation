const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

module.exports = async function (context, req) {

    if (!connectionString) {
        context.res = {
            status: 500,
            body: "AZURE_STORAGE_CONNECTION_STRING is missing."
        };
        return;
    }

    const tableClient = TableClient.fromConnectionString(
        connectionString,
        "rsvps"
    );

    try {

        // GET all RSVPs
        if (req.method === "GET") {

            const entities = [];

            const iterator = tableClient.listEntities();

            for await (const entity of iterator) {
                entities.push(entity);
            }

            context.res = {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                },
                body: entities
            };

            return;
        }

        // POST new RSVP
        if (req.method === "POST") {

            const data = req.body;

            if (!data || !data.name) {
                context.res = {
                    status: 400,
                    body: "Invalid RSVP payload."
                };
                return;
            }

            const cleanRowKey = data.name
                .replace(/[\/\\?#\t\n\r]/g, "")
                .trim();

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

            context.res = {
                status: 200,
                body: {
                    success: true,
                    message: "RSVP saved successfully."
                }
            };

            return;
        }

        context.res = {
            status: 405,
            body: "Method not allowed."
        };

    } catch (err) {

        context.log.error(err);

        context.res = {
            status: 500,
            body: `Server error: ${err.message}`
        };
    }
};
