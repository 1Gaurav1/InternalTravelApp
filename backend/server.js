import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config'; 

const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- 1. FIXED: Health Check Route (Added) ---
// This lets you open the URL in a browser to confirm it's working
app.get('/', (req, res) => {
  res.send('Backend is running successfully! API endpoints are at /api/users, /api/requests, etc.');
});

// Counter Schema
const trCounterSchema = new mongoose.Schema({
  date: String,
  lastCounter: Number
});
const TRCounter = mongoose.model('TRCounter', trCounterSchema);

async function generateTRId() {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let record = await TRCounter.findOne({ date: today });

  let counter = 1;

  if (record) {
    counter = record.lastCounter + 1;
    record.lastCounter = counter;
    await record.save();
  } else {
    await TRCounter.create({ date: today, lastCounter: 1 });
  }

  return `TR-${today}-${String(counter).padStart(4, '0')}`;
}

// MONGO CONNECTION
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedData();
  })
  .catch(err => console.log('MongoDB Connection Error:', err));

// SCHEMA
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
  
  // --- 2. FIXED: Changed from String to Date ---
  submittedDate: { type: Date, default: Date.now }, 
  
  agentNotes: String,
  employeeAvatar: String,
  agentOptions: [String],
  
  // --- 3. FIXED: Removed duplicate 'agentNotes' line that was here ---
});
const TravelRequest = mongoose.model('TravelRequest', requestSchema);

// Seeding
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

// API Routes

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
  const trId = await generateTRId();

  const newReq = new TravelRequest({
    ...req.body,
    id: trId
    // submittedDate will now automatically default to Date.now() if not provided
  });

  await newReq.save();
  res.json(newReq);
});

app.put('/api/requests/:id/status', async (req, res) => {
  const { status, agentNotes } = req.body;
  const update = { status };
  if (agentNotes) update.agentNotes = agentNotes;
  
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

// Agent sends travel options
app.put('/api/requests/:id/options', async (req, res) => {
  const { options } = req.body;

  const updated = await TravelRequest.findOneAndUpdate(
    { id: req.params.id },
    { agentOptions: options, status: "Action Required" },
    { new: true }
  );

  res.json(updated);
});

// STATS
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    // Calculate month boundaries safely
    const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentCount = await TravelRequest.countDocuments({
      submittedDate: { $gte: startCurrentMonth }
    });

    const previousCount = await TravelRequest.countDocuments({
      submittedDate: { $gte: startLastMonth, $lte: endLastMonth }
    });

    const percentChange =
      previousCount === 0
        ? 100
        : ((currentCount - previousCount) / previousCount) * 100;

    const approved = await TravelRequest.countDocuments({
      status: { $in: ["Booked", "Processing (Agent)"] }
    });

    const pending = await TravelRequest.countDocuments({
      status: /Pending/
    });

    const rejected = await TravelRequest.countDocuments({
      status: "Rejected"
    });

    res.json({
      total: currentCount,
      totalAllTime: await TravelRequest.countDocuments(),
      approved,
      pending,
      rejected,
      percentChange: Number(percentChange.toFixed(2))
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Error calculating stats" });
  }
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});