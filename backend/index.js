const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Sequelize setup
const sequelize = new Sequelize('schema_mapper', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres'
});

// Test connection
sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Connection error:', err));

// Add mapping
app.post('/mappings', async (req, res) => {
  const { client_id, internal_field, client_field, direction, transform } = req.body;
  try {
    await sequelize.query(
      'INSERT INTO mappings (client_id, internal_field, client_field, direction, transform) VALUES (:client_id, :internal_field, :client_field, :direction, :transform) ON CONFLICT ON CONSTRAINT mappings_client_id_internal_field_client_field_key DO NOTHING',
      {
        replacements: { client_id, internal_field, client_field, direction, transform },
        type: sequelize.QueryTypes.INSERT
      }
    );
    res.json({ message: 'Mapping added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mappings
app.get('/mappings/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  try {
    const mappings = await sequelize.query(
      'SELECT internal_field, client_field, transform FROM mappings WHERE client_id = :clientId',
      {
        replacements: { clientId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dynamic fields from client_person schema
app.get('/client-schema', async (req, res) => {
  try {
    const fields = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'client_person' AND column_name NOT IN ('id', 'client_id', 'created_at', 'updated_at')",
      {
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.json(fields.map(f => f.column_name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post data to both tables
app.post('/post-data/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  const data = req.body;

  try {
    // Insert into client_person
    const clientColumns = Object.keys(data).join(', ');
    const clientValues = Object.values(data).map((v, i) => `:value${i}`).join(', ');
    await sequelize.query(
      `INSERT INTO client_person (client_id, ${clientColumns}) VALUES (:clientId, ${clientValues})`,
      {
        replacements: { clientId, ...Object.values(data).reduce((acc, v, i) => ({ ...acc, [`value${i}`]: v }), {}) },
        type: sequelize.QueryTypes.INSERT
      }
    );

    // Fetch mappings
    const mappings = await sequelize.query(
      'SELECT internal_field, client_field, transform FROM mappings WHERE client_id = :clientId',
      {
        replacements: { clientId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const mappedData = {};
    mappings.forEach(mapping => {
      let value = data[mapping.client_field];
      if (value !== undefined && mapping.transform === 'uppercase') value = value.toUpperCase();
      mappedData[mapping.internal_field] = value;
    });

    const internalColumns = Object.keys(mappedData).filter(col => mappedData[col] !== undefined).join(', ');
    const internalValues = Object.values(mappedData).filter((v, i) => mappedData[Object.keys(mappedData)[i]] !== undefined).map((v, i) => `:mappedValue${i}`).join(', ');
    await sequelize.query(
      `INSERT INTO internal_person (client_id, ${internalColumns}) VALUES (:clientId, ${internalValues})`,
      {
        replacements: { clientId, ...Object.values(mappedData).reduce((acc, v, i) => ({ ...acc, [`mappedValue${i}`]: v }), {}) },
        type: sequelize.QueryTypes.INSERT
      }
    );

    res.json({ message: 'Data posted to both tables successfully' });
  } catch (error) {
    console.error('Error in post-data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post data to client_person only
app.post('/post-to-client/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  const data = req.body; // e.g., { personname: 'Bob', age: 35, extra: 'test' }

  try {
    // Define valid client_person columns
    const validColumns = ['personname', 'age'];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => validColumns.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: 'No valid data provided for client_person' });
    }

    // Log the filtered data for debugging
    console.log('Filtered data for client_person:', filteredData);

    // Insert into client_person (new row with only valid columns)
    const clientColumns = Object.keys(filteredData).join(', ');
    const clientValues = Object.values(filteredData).map((v, i) => `:value${i}`).join(', ');
    await sequelize.query(
      `INSERT INTO client_person (client_id, ${clientColumns}) VALUES (:clientId, ${clientValues})`,
      {
        replacements: { clientId, ...Object.values(filteredData).reduce((acc, v, i) => ({ ...acc, [`value${i}`]: v }), {}) },
        type: sequelize.QueryTypes.INSERT
      }
    );

    res.json({ message: 'Data posted to client_person successfully' });
  } catch (error) {
    console.error('Error in post-to-client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync inbound (GET flow)
app.get('/sync-inbound/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  try {
    const clientData = await sequelize.query(
      'SELECT personname, age FROM client_person WHERE client_id = :clientId',
      {
        replacements: { clientId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!clientData.length) {
      return res.status(404).json({ error: 'No data found in client_person' });
    }

    const mappings = await sequelize.query(
      'SELECT internal_field, client_field, transform FROM mappings WHERE client_id = :clientId',
      {
        replacements: { clientId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!mappings.length) {
      return res.status(404).json({ error: 'No mappings found' });
    }

    const row = clientData[0]; // Process first row for simplicity
    const mappedData = {};
    mappings.forEach(mapping => {
      let value = row[mapping.client_field];
      if (mapping.transform === 'uppercase') value = value.toUpperCase();
      mappedData[mapping.internal_field] = value;
    });

    const internalColumns = Object.keys(mappedData).join(', ');
    const internalValues = Object.values(mappedData).map((v, i) => `:mappedValue${i}`).join(', ');
    await sequelize.query(
      `INSERT INTO internal_person (client_id, ${internalColumns}) VALUES (:clientId, ${internalValues})`,
      {
        replacements: { clientId, ...Object.values(mappedData).reduce((acc, v, i) => ({ ...acc, [`mappedValue${i}`]: v }), {}) },
        type: sequelize.QueryTypes.INSERT
      }
    );

    res.json({ syncedData: mappedData });
  } catch (error) {
    console.error('Error in sync-inbound:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get synced data from internal_person
app.get('/internal-person/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  try {
    const data = await sequelize.query(
      'SELECT person_name, age FROM internal_person WHERE client_id = :clientId',
      {
        replacements: { clientId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.json(data);
  } catch (error) {
    console.error('Error in internal-person:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});