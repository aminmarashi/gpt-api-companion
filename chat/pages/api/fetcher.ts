import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from 'mongodb';
import { NodeHtmlMarkdown } from "node-html-markdown";

if (!process.env.MONGO_URL) {
  throw new Error('Please define the MONGO_URL environment variable inside .env.local')
}

const client = new MongoClient(process.env.MONGO_URL);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  if (req.method === 'OPTIONS' || req.method === 'GET') {
    return res.status(200).send('ok')
  }
  if (req.method === 'POST') {
    const { url, user } = req.body;
    const db = client.db('chat');
    const collection = db.collection('history');
    try {
      const history = await collection.findOne({ user });
      if (!history) {
        res.status(403).send('You are not allowed to do this.')
      }
    } catch (e) {
      console.error(e)
      res.status(403).send('You are not allowed to do this.')
    }
    const response = await fetch(url).then((res) => res.text());
    res.status(200).send(
      NodeHtmlMarkdown.translate(response)
    )
  } else {
    res.status(404).send(`The HTTP ${req.method} method is not supported at this route.`)
  }
}