const express = require("express");
const translate = require("node-google-translate-skidz");
const app = express();
const port = 3000;

//middlewate estatico: 
app.use(express.static("contenidoFront"))

app.use(express.json());
app.listen(port, () => {
    console.log(`"server is running on port ${port}`);
});

//traductor: 
app.post('/translate', (req, res) => {
    const { text, lenguajeDestino } = req.body;

    if (!text || !lenguajeDestino) {
        return res.status(400).json({ error: 'No hay suficiente información.' });
    }

    translate({
        text: text,
        source: 'en',
        target: lenguajeDestino,
    }, (result) => {
        if (result && result.translation) {
            res.json({ translatedText: result.translation });
        } else {
            res.status(500).json({ error: 'Error al traducir el texto.' });
        }
    });
});