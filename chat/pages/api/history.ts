// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

// create a mongo instance
import { MongoClient, ObjectId } from 'mongodb';
import { Message } from '@/common/types';

if (!process.env.MONGO_URL) {
  throw new Error('Please define the MONGO_URL environment variable inside .env.local')
}

const client = new MongoClient(process.env.MONGO_URL);

type History = {
  id: string;
  messages: Message[];
}[]

type Error = {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<History | Error>
) {
  if (req.method === 'GET') {
    await getHandler(req, res);
  } else if (req.method === 'POST') {
    await postHandler(req, res);
  } else if (req.method === 'DELETE') {
    await deleteHandler(req, res);
  } else {
    res.status(404).json({
      error: `The HTTP ${req.method} method is not supported at this route.`,
    })
  }
}

async function getHandler(req: NextApiRequest, res: NextApiResponse<History | Error>) {
  const { user } = req.query;
  if (!user) {
    res.status(400).json({ error: 'Missing user' })
    return;
  }
  try {
    await client.connect();
  } catch (e) {
    res.status(500).json({ error: 'Could not connect to database' })
    return
  }
  const db = client.db('chat');
  const collection = db.collection('history');
  try {
    const history = await collection.find({ user }).toArray();

    res.status(200).json(history.map(({ _id, ...rest }) => ({ id: _id, ...rest })))
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: 'id not found' })
  }
}

async function postHandler(req: NextApiRequest, res: NextApiResponse<History | Error>) {
  const { user, id, messages } = req.body;
  if (!user) {
    res.status(400).json({ error: 'Missing user' })
    return;
  }
  const _id = id ? new ObjectId(id) : new ObjectId();
  try {
    await client.connect();
  } catch (e) {
    res.status(500).json({ error: 'Could not connect to database' })
    return
  }
  const db = client.db('chat');
  const collection = db.collection('history');
  try {
    await collection.updateOne(
      { _id },
      { $set: { user, messages } },
      { upsert: true }
    );

    const history = await collection.find({ user }).toArray();

    res.status(200).json(history.map(({ _id, ...rest }) => ({ id: _id, ...rest })))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'failed to write the history' })
  }
}

async function deleteHandler(req: NextApiRequest, res: NextApiResponse<History | Error>) {
  const { user, id } = req.query;
  if (!user) {
    res.status(400).json({ error: 'Missing user' })
    return;
  }
  if (!id) {
    res.status(400).json({ error: 'Missing id' })
    return;
  }
  try {
    await client.connect();
  } catch (e) {
    res.status(500).json({ error: 'Could not connect to database' })
    return
  }
  const db = client.db('chat');
  const collection = db.collection('history');
  try {
    await collection.deleteOne({ _id: new ObjectId(id as string) });

    const history = await collection.find({ user }).toArray();

    res.status(200).json(history.map(({ _id, ...rest }) => ({ id: _id, ...rest })))
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: 'id not found' })
  }
}