import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config'; 

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(cors());
app.use(express.json());

// MONGO CONNECTION
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedData();
  })
  .catch(err => console.log('MongoDB Connection Error:', err));

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  password: { type: String, default: '123' },
  role: String,
  department: String,
  status: String,
  lastActive: String,
  avatar: String
});
const User = mongoose.model('User', userSchema);

const requestSchema = new mongoose.Schema({
  id: String,
  destination: String,
  startDate: String,
  endDate: String,
  startTime: String,
  endTime: String,
  status: String,
  amount: Number,
  employeeName: String,
  department: String,
  type: String,
  purpose: String,
  submittedDate: String,
  agentNotes: String,
  employeeAvatar: String
});
const TravelRequest = mongoose.model('TravelRequest', requestSchema);

// --- SEEDING ---
async function seedData() {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Seeding default users...');
    const users = [
      { id: '1', name: 'Alex Morgan', email: 'employee@renee.com', role: 'EMPLOYEE', department: 'Product', status: 'Active', lastActive: '2 mins ago', avatar: 'https://picsum.photos/seed/alex/200' },
      { id: '2', name: 'James Wilson', email: 'manager@renee.com', role: 'MANAGER', department: 'Sales', status: 'Active', lastActive: '1 hour ago', avatar: 'https://picsum.photos/seed/james/200' },
      { id: '3', name: 'Sarah Jenkins', email: 'admin@renee.com', role: 'ADMIN', department: 'IT', status: 'Active', lastActive: '5 hours ago', avatar: 'https://picsum.photos/seed/sarah/200' },
      { id: '4', name: 'Super Admin', email: 'super@renee.com', role: 'SUPER_ADMIN', department: 'Executive', status: 'Active', lastActive: 'Just now', avatar: 'https://picsum.photos/seed/super/200' },
      { id: '5', name: 'Travel Desk', email: 'agent@renee.com', role: 'TRAVEL_AGENT', department: 'Operations', status: 'Active', lastActive: '10 mins ago', avatar: 'https://picsum.photos/seed/agent/200' },
    ];
    await User.insertMany(users);
  }
}

// --- API ROUTES ---

// USERS
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  await User.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// REQUESTS
app.get('/api/requests', async (req, res) => {
  const requests = await TravelRequest.find();
  res.json(requests);
});

app.post('/api/requests', async (req, res) => {
  const newReq = new TravelRequest(req.body);
  await newReq.save();
  res.json(newReq);
});

app.put('/api/requests/:id/status', async (req, res) => {
  const { status, agentNotes } = req.body;
  const update = { status };
  if(agentNotes) update.agentNotes = agentNotes;
  
  const updatedReq = await TravelRequest.findOneAndUpdate(
    { id: req.params.id }, 
    update, 
    { new: true }
  );
  res.json(updatedReq);
});

app.delete('/api/requests/:id', async (req, res) => {
  await TravelRequest.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));