const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.odwvb.mongodb.net/doctorapp?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('doctors'));
app.use(fileUpload());
const port = 8000;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
client.connect((err) => {
	const appointmentCollection = client
		.db('doctorapp')
		.collection('appointment');
	const doctorCollection = client.db('doctorapp').collection('doctors');
	app.post('/addBooking', (req, res) => {
		const newBooking = req.body;
		appointmentCollection.insertOne(newBooking).then((result) => {
			res.send(result.insertedCount > 0);
		});
	});
	app.post('/appointmentByDate', (req, res) => {
		const dates = req.body;
		const email = req.body.email;
		doctorCollection.find({ email: email }).toArray((err, doctors) => {
			let filter;
			if (doctors.length == 0) {
				filter = { email: email, date: dates.date };
			} else {
				filter = { date: dates.date, doctorEmail: email };
			}
			console.log(filter);
			appointmentCollection.find(filter).toArray((err, documents) => {
				res.send(documents);
			});
		});
	});

	// admin panel  add doctor
	app.post('/addDoctors', (req, res) => {
		const file = req.files.file;
		const name = req.body.name;
		const email = req.body.email;
		const department = req.body.department;
		const Schedule = req.body.Schedule;
		const newImg = file.data;
		const encImg = newImg.toString('base64');
		var image = {
			contentType: req.files.file.mimetype,
			size: req.files.file.size,
			img: Buffer.from(encImg, 'base64'),
		};
		doctorCollection
			.insertOne({ name, email, image, department, Schedule })
			.then((result) => {
				res.send(result.insertedCount > 0);
			});
		// file.mv(`${__dirname}/doctors/${file.name}`, err => {
		//     if (err) {
		//         console.log(err);
		//         return res.status(500).send({ massage: 'Faild to upload Image' });
		//     }
		//     return res.status(200).send({ name: file.name, path: `/${file.name}`, message: 'Successfully img uploaded' })
		// })
	});
	app.post('/toDayAppointment', (req, res) => {
		const date = req.body.date;
		appointmentCollection.find({ date: date }).toArray((err, documents) => {
			res.send(documents);
		});
	});
	app.get('/allPatients', (req, res) => {
		appointmentCollection.find({}).toArray((err, documents) => {
			res.send(documents);
		});
	});

	// admin panel  show dashboard as a admin role
	app.post('/isDoctor', (req, res) => {
		const email = req.body.email;
		doctorCollection.find({ email: email }).toArray((err, doctors) => {
			res.send(doctors.length > 0);
		});
	});
	// admin panel  show all
	app.get('/doctors', (req, res) => {
		doctorCollection.find({}).toArray((err, documents) => {
			res.send(documents);
		});
	});
});

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(port);
