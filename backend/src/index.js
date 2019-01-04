const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

server.express.use(cookieParser());
// TODO Use express middlware to populate current user

//Decode the JWT so we can get the user id on each request
server.express.use((req, res, next) => {
	const { token } = req.cookies;
	if (token) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET);
		// Grabbing token from "req.cookies" using JWT method to decode token to grab userId for each request
		req.userId = userId;
	}
	next();
});

server.start(
	{
		cors: {
			credentials: true,
			origin: process.env.FRONTEND_URL
		}
	},
	(res) => {
		console.log(`Warpage locked on http://localhost:${res.port}`);
	}
);
