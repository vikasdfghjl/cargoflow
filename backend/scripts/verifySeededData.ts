import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Address from '../src/models/Address';
import connectDB from '../src/config/database';

// Load environment variables
dotenv.config();

async function verifySeededData() {
  try {
    console.log('🔍 Connecting to database to verify seeded data...');
    
    // Connect to the database
    await connectDB();
    
    console.log('\n👥 Users in database:');
    const users = await User.find({}, 'firstName lastName email userType companyName phone isActive').sort({ userType: 1, firstName: 1 });
    
    for (const user of users) {
      const addressCount = await Address.countDocuments({ userId: user._id });
      console.log(`   ${user.userType === 'admin' ? '🔐' : '📝'} ${user.firstName} ${user.lastName}`);
      console.log(`      📧 ${user.email}`);
      console.log(`      🏢 ${user.companyName || 'N/A'}`);
      console.log(`      📞 ${user.phone}`);
      console.log(`      🏠 Addresses: ${addressCount}`);
      console.log(`      ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    console.log('🏠 Addresses breakdown:');
    const addresses = await Address.find({}).populate('userId', 'firstName lastName email');
    
    const addressesByUser: { [key: string]: any[] } = {};
    addresses.forEach(addr => {
      const userKey = (addr.userId as any).email;
      if (!addressesByUser[userKey]) {
        addressesByUser[userKey] = [];
      }
      addressesByUser[userKey].push(addr);
    });
    
    for (const [userEmail, userAddresses] of Object.entries(addressesByUser)) {
      const user = userAddresses[0].userId as any;
      console.log(`   📧 ${user.firstName} ${user.lastName} (${userEmail}):`);
      
      userAddresses.forEach((addr, index) => {
        console.log(`      ${index + 1}. ${addr.label} ${addr.isDefault ? '⭐ (Default)' : ''}`);
        console.log(`         📍 ${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`);
        console.log(`         🏷️ Type: ${addr.type}`);
        console.log(`         👤 Contact: ${addr.contactName} (${addr.phone})`);
        if (addr.landmark) console.log(`         🗺️ Landmark: ${addr.landmark}`);
        if (addr.instructions) console.log(`         📝 Instructions: ${addr.instructions}`);
        console.log('');
      });
    }
    
    console.log('✅ Verification completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

// Run the verification function
if (require.main === module) {
  verifySeededData();
}
