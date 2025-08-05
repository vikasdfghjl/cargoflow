import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Address from '../src/models/Address';
import connectDB from '../src/config/database';

// Load environment variables
dotenv.config();

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'customer' | 'admin';
  phone: string;
  companyName?: string;
}

interface AddressData {
  userId: string;
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  contactName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  landmark?: string;
  instructions?: string;
}

const seedUsers: UserData[] = [
  {
    firstName: 'Vikas',
    lastName: 'Sharma',
    email: 'vikas@gmail.com',
    password: 'Password@123',
    userType: 'customer',
    phone: '+15551234567',
    companyName: 'Vikas Logistics Ltd'
  },
  {
    firstName: 'Farhan',
    lastName: 'Khan',
    email: 'farhan@gmail.com',
    password: 'Password@123',
    userType: 'customer',
    phone: '+15551234568',
    companyName: 'Farhan Transport Co'
  },
  {
    firstName: 'Admin',
    lastName: 'CargoFlow',
    email: 'admin@cargoflow.com',
    password: 'Password@123',
    userType: 'admin',
    phone: '+15559876543',
    companyName: 'CargoFlow Systems'
  }
];

const generateAddresses = (userId: string, userName: string): AddressData[] => {
  const baseAddresses = [
    {
      label: `${userName}'s Home`,
      type: 'home' as const,
      contactName: userName,
      phone: '+15551234567',
      street: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'New York',
      zipCode: '100001',
      country: 'United States',
      isDefault: true,
      landmark: 'Near Central Park',
      instructions: 'Please ring doorbell twice'
    },
    {
      label: `${userName}'s Office`,
      type: 'office' as const,
      contactName: `${userName} (Office)`,
      phone: '+15551234567',
      street: '456 Business Plaza, Suite 200',
      city: 'Los Angeles',
      state: 'California',
      zipCode: '900001',
      country: 'United States',
      isDefault: false,
      landmark: 'Business District',
      instructions: 'Reception on 2nd floor'
    },
    {
      label: `${userName}'s Warehouse`,
      type: 'warehouse' as const,
      contactName: `${userName} (Warehouse)`,
      phone: '+15551234567',
      street: '789 Industrial Ave, Unit 15',
      city: 'Chicago',
      state: 'Illinois',
      zipCode: '600001',
      country: 'United States',
      isDefault: false,
      landmark: 'Industrial Zone',
      instructions: 'Loading dock at rear entrance'
    }
  ];

  return baseAddresses.map(addr => ({
    userId,
    ...addr
  }));
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to the database
    await connectDB();
    
    console.log('🗑️ Cleaning existing seed data...');
    
    // Remove existing users and addresses (only the ones we're about to create)
    const emailsToRemove = seedUsers.map(user => user.email);
    const existingUsers = await User.find({ email: { $in: emailsToRemove } });
    const userIdsToRemove = existingUsers.map(user => user._id);
    
    if (userIdsToRemove.length > 0) {
      await Address.deleteMany({ userId: { $in: userIdsToRemove } });
      await User.deleteMany({ _id: { $in: userIdsToRemove } });
      console.log(`🗑️ Removed ${userIdsToRemove.length} existing users and their addresses`);
    }

    console.log('👥 Creating users...');
    const createdUsers: any[] = [];

    // Create users
    for (const userData of seedUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        userType: userData.userType,
        phone: userData.phone,
        companyName: userData.companyName,
        isActive: true,
        lastLogin: new Date()
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);
      
      console.log(`✅ Created ${userData.userType}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    }

    console.log('🏠 Creating addresses...');
    let totalAddresses = 0;

    // Create addresses for customer users only (not admin)
    for (const user of createdUsers) {
      if (user.userType === 'customer') {
        const addresses = generateAddresses(user._id.toString(), user.firstName);
        
        for (const addressData of addresses) {
          const address = new Address({
            userId: addressData.userId,
            label: addressData.label,
            type: addressData.type,
            contactName: addressData.contactName,
            phone: addressData.phone,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
            isDefault: addressData.isDefault,
            landmark: addressData.landmark,
            instructions: addressData.instructions
          });

          await address.save();
          totalAddresses++;
        }
        
        console.log(`✅ Created 3 addresses for ${user.firstName} ${user.lastName}`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users created: ${createdUsers.length}`);
    console.log(`   🏠 Addresses created: ${totalAddresses}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('📝 Customer Users:');
    console.log('   📧 vikas@gmail.com / Password@123');
    console.log('   📧 farhan@gmail.com / Password@123');
    console.log('🔐 Admin User:');
    console.log('   📧 admin@cargoflow.com / Password@123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}
