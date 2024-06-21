import { z } from "zod"
import * as Realm from 'realm-web';
import {
	toJSON,
	toError,
	reply,
} from "./utils"
import { startStudy } from "./studies/startStudy";



let App;
const ObjectId = Realm.BSON.ObjectID;

export default {
	async fetch(request, env, ctx) {
		// const uri = env.MONGODB_URI;
		// // const client = new MongoClient(uri);

		// try {
		// 	// await client.connect();
		// 	// const database = client.db('hemvip');
		// 	// const collection = database.collection('studies');

		// 	// Example: Insert a document
		// 	// const result = await collection.insertOne({ message: 'Hello from Cloudflare Worker!' });
		// 	// const configs = await database.collection("config").find({}).toArray()
		// 	//   result.insertedId
		// 	const configs = {}

		// 	return Response.json({ success: true, msg: "", error: null, data: configs });
		// } catch (error) {
		// 	return Response.json({ success: false, msg: "", error: error, data: null });
		// } finally {
		// 	// await client.close();
		// }
		const url = new URL(request.url);
		App = App || new Realm.App(env.ATLAS_APPID);
		const method = request.method;
		const path = url.pathname.replace(/[/]$/, '');
		// const todoID = url.searchParams.get('id') || '';
		if (path !== '/api/studies') {
			return toError(`Unknown '${path}' URL; try '/api/studies' instead.`, 404);
		}
		const token = request.headers.get('authorization');
		if (!token)
			return toError(`Missing 'authorization' header; try to add the header 'authorization: ATLAS_APP_API_KEY'.`, 401);
		try {
			const credentials = Realm.Credentials.apiKey(token);
			// Attempt to authenticate
			var user = await App.logIn(credentials);
			var client = user.mongoClient('mongodb-atlas');
		}
		catch (err) {
			return toError('Error with authentication.', 500);
		}

		try {
			// GET /api/studies
			if (method === 'GET') {
				// console.log("client", client)
				const db = client.db("hemvip")
				const studies = await db.collection("studies").find()
				// const collection = client.db('hemvip').collection('studies');
				// const studies = await collection.find({}).toArray()
				return Response.json({ success: true, msg: "", error: null, data: studies })
			}
			// POST /api/studies
			if (method === 'POST') {
				const { prolificid, studyid, sessionid } = await request.json();

				const { errors, success, data, msg } = await startStudy(client, prolificid, studyid, sessionid)

				return Response.json({ errors, success, data, msg })
			}
			// // PATCH /api/studies?id=XXX&done=true
			// if (method === 'PATCH') {
			// 	return reply(await collection.updateOne({
			// 		_id: new ObjectId(todoID)
			// 	}, {
			// 		$set: {
			// 			done: url.searchParams.get('done') === 'true'
			// 		}
			// 	}));
			// }
			// // DELETE /api/studies?id=XXX
			// if (method === 'DELETE') {
			// 	return reply(await collection.deleteOne({
			// 		_id: new ObjectId(todoID)
			// 	}));
			// }
			// unknown method
			return toError('Method not allowed.', 405);
		}
		catch (err) {
			return Response.json({
				errors: err,
				success: false,
				data: null,
				msg: "Internal server error",
			})
		}
	},
};
