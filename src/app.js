const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de verificación
app.get('/', (req, res) => {
  res.json({ 
    message: 'API ERP Ventas funcionando correctamente',
    endpoints: [
      '/api/interactions',
      '/api/sales',
      '/api/sales/clients/search',
      '/api/sales/clients/:clientRef',
      '/api/opportunities'
    ]
  });
});

// Rutas
const interactionRoutes = require('./routes/interaction.routes');
app.use('/api/interactions', interactionRoutes);

const salesRoutes = require('./routes/sales.routes');
app.use('/api/sales', salesRoutes);

const opportunityRoutes = require('./routes/opportunity.routes');
app.use('/api/opportunities', opportunityRoutes);

module.exports = app;