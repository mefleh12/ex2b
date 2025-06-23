// המגיש : מופלח שיבלי , ת"ז : 214310633
// ההרחבות שהקוד מייבא:
// express – מספק מסגרת לפיתוח אפליקציית ווב ובניית ראוטים
// sqlite3 – מאפשר חיבור לבסיס נתונים מסוג SQLite וביצוע שאילתות
// path – מספק כלים לעבודה עם נתיבים של קבצים בצורה ניידת בין מערכות הפעלה
// fs – מאפשר גישה לקבצים ולמערכת הקבצים לצורך בדיקה אם קובץ קיים וכדומה
// TO START THE SERVER WRITE IN THE TARMINAL:  node movie.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname); // Set views to the root directory
app.use(express.static(path.join(__dirname, 'styles')));

// Middleware to serve static files
app.use(express.static(__dirname));

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'db', 'rtfilms.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the RTfilms SQLite database.');
    }
});


// Function to check for poster file (JPG/PNG)
const getPosterPath = (folder) => {
    const jpgPath = path.join(__dirname, folder, 'poster.jpg');
    const pngPath = path.join(__dirname, folder, 'poster.png');

    if (fs.existsSync(jpgPath)) {
        return `/${folder}/poster.jpg`;
    } else if (fs.existsSync(pngPath)) {
        return `/${folder}/poster.png`;
    } else {
        return `/default-poster.jpg`; // Fallback image
    }
};

// Route to fetch and display movie details
app.get('/', (req, res) => {
    const filmCode = req.query.title;

    if (!filmCode) {
        return res.status(400).send("Missing film title parameter.");
    }

    const sql = `SELECT * FROM Films WHERE FilmCode = ?`;
    db.get(sql, [filmCode], (err, film) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send("Internal Server Error");
        }

        if (!film) {
            return res.status(404).send("Movie not found");
        }

        // Assign the correct poster path
        film.PosterPath = getPosterPath(film.FilmCode);

        // Fetch reviews related to the movie
        const reviewSql = `SELECT * FROM Reviews WHERE FilmCode = ?`;
        db.all(reviewSql, [film.FilmCode], (err, reviews) => {
            if (err) {
                console.error('Error fetching reviews:', err.message);
                return res.status(500).send("Error retrieving reviews");
            }

            // Render the movie.ejs file with movie details and reviews
            // Fetch additional film details from FilmDetails
const detailsSql = `SELECT Attribute, Value FROM FilmDetails WHERE FilmCode = ?`;
db.all(detailsSql, [film.FilmCode], (err, details) => {
    if (err) {
        console.error('Error fetching film details:', err.message);
        return res.status(500).send("Error retrieving film details");
    }

    // Convert details array into an object for easier access in EJS
    const filmDetails = {};
    details.forEach(detail => {
        filmDetails[detail.Attribute] = detail.Value;
    });

    // Render the EJS template with all data
    res.render('movie', { film, reviews, filmDetails });
});

        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
