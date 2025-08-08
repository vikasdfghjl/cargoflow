import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Address from '../src/models/Address';
import Driver from '../src/models/Driver';
import Booking from '../src/models/Booking';
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

interface DriverData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  experience: number;
  vehicle: {
    number: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    model: string;
    capacity: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  totalDeliveries: number;
  documents: {
    license: string;
    insurance: string;
    registration: string;
  };
  availability: {
    isAvailable: boolean;
    availableFrom?: Date;
    availableTo?: Date;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
}

interface BookingData {
  customerId: string;
  driverId?: string;
  pickupAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
  };
  deliveryAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
  };
  packageType: 'document' | 'package' | 'fragile' | 'bulk';
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  serviceType: 'standard' | 'express' | 'same_day';
  pickupDate: Date;
  baseCost: number;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
  specialInstructions?: string;
  insurance: boolean;
  trackingNumber?: string;
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
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya@gmail.com',
    password: 'Password@123',
    userType: 'customer',
    phone: '+15551234569',
    companyName: 'Patel Industries'
  },
  {
    firstName: 'Rahul',
    lastName: 'Singh',
    email: 'rahul@gmail.com',
    password: 'Password@123',
    userType: 'customer',
    phone: '+15551234570',
    companyName: 'Singh Enterprises'
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

const seedDrivers: DriverData[] = [
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.driver@gmail.com',
    password: 'Driver@123',
    phone: '+15557001001',
    licenseNumber: 'DL12345678901',
    licenseExpiry: new Date('2026-12-31'),
    experience: 8,
    vehicle: {
      number: 'MH12AB1234',
      type: 'truck',
      model: 'Tata LPT 1613',
      capacity: 5000
    },
    status: 'active',
    rating: 4.8,
    totalDeliveries: 234,
    documents: {
      license: 'license_rajesh_001.pdf',
      insurance: 'insurance_rajesh_001.pdf',
      registration: 'registration_rajesh_001.pdf'
    },
    availability: {
      isAvailable: true
    },
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai, Maharashtra',
      lastUpdated: new Date()
    }
  },
  {
    firstName: 'Amit',
    lastName: 'Patel',
    email: 'amit.driver@gmail.com',
    password: 'Driver@123',
    phone: '+15557001002',
    licenseNumber: 'DL12345678902',
    licenseExpiry: new Date('2025-11-30'),
    experience: 5,
    vehicle: {
      number: 'GJ01CD5678',
      type: 'van',
      model: 'Mahindra Bolero Pickup',
      capacity: 1500
    },
    status: 'active',
    rating: 4.7,
    totalDeliveries: 186,
    documents: {
      license: 'license_amit_002.pdf',
      insurance: 'insurance_amit_002.pdf',
      registration: 'registration_amit_002.pdf'
    },
    availability: {
      isAvailable: false
    },
    currentLocation: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Pune, Maharashtra',
      lastUpdated: new Date()
    }
  },
  {
    firstName: 'Suresh',
    lastName: 'Yadav',
    email: 'suresh.driver@gmail.com',
    password: 'Driver@123',
    phone: '+15557001003',
    licenseNumber: 'DL12345678903',
    licenseExpiry: new Date('2026-06-15'),
    experience: 12,
    vehicle: {
      number: 'DL03EF9012',
      type: 'truck',
      model: 'Ashok Leyland Partner',
      capacity: 3000
    },
    status: 'active',
    rating: 4.6,
    totalDeliveries: 145,
    documents: {
      license: 'license_suresh_003.pdf',
      insurance: 'insurance_suresh_003.pdf',
      registration: 'registration_suresh_003.pdf'
    },
    availability: {
      isAvailable: true
    },
    currentLocation: {
      latitude: 28.7041,
      longitude: 77.1025,
      address: 'Delhi, India',
      lastUpdated: new Date()
    }
  },
  {
    firstName: 'Mohan',
    lastName: 'Lal',
    email: 'mohan.driver@gmail.com',
    password: 'Driver@123',
    phone: '+15557001004',
    licenseNumber: 'DL12345678904',
    licenseExpiry: new Date('2025-09-20'),
    experience: 3,
    vehicle: {
      number: 'KA05GH3456',
      type: 'van',
      model: 'Force Traveller',
      capacity: 2000
    },
    status: 'inactive',
    rating: 4.5,
    totalDeliveries: 98,
    documents: {
      license: 'license_mohan_004.pdf',
      insurance: 'insurance_mohan_004.pdf',
      registration: 'registration_mohan_004.pdf'
    },
    availability: {
      isAvailable: false
    },
    currentLocation: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Bangalore, Karnataka',
      lastUpdated: new Date()
    }
  },
  {
    firstName: 'Ravi',
    lastName: 'Sharma',
    email: 'ravi.driver@gmail.com',
    password: 'Driver@123',
    phone: '+15557001005',
    licenseNumber: 'DL12345678905',
    licenseExpiry: new Date('2026-03-10'),
    experience: 2,
    vehicle: {
      number: 'TN07IJ7890',
      type: 'bike',
      model: 'Honda Activa',
      capacity: 50
    },
    status: 'suspended',
    rating: 3.8,
    totalDeliveries: 67,
    documents: {
      license: 'license_ravi_005.pdf',
      insurance: 'insurance_ravi_005.pdf',
      registration: 'registration_ravi_005.pdf'
    },
    availability: {
      isAvailable: false
    },
    currentLocation: {
      latitude: 13.0827,
      longitude: 80.2707,
      address: 'Chennai, Tamil Nadu',
      lastUpdated: new Date()
    }
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

const generateBookings = (customerIds: string[], driverIds: string[]): BookingData[] => {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad'];
  const statuses: BookingData['status'][] = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
  const packageTypes: BookingData['packageType'][] = ['document', 'package', 'fragile', 'bulk'];
  const serviceTypes: BookingData['serviceType'][] = ['standard', 'express', 'same_day'];

  const bookings: BookingData[] = [];

  // Generate 25 bookings
  for (let i = 0; i < 25; i++) {
    const pickupCity = cities[Math.floor(Math.random() * cities.length)]!;
    const deliveryCity = cities[Math.floor(Math.random() * cities.length)]!;
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]!;
    const driverId = Math.random() > 0.3 ? driverIds[Math.floor(Math.random() * driverIds.length)]! : undefined; // 70% assigned
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const packageType = packageTypes[Math.floor(Math.random() * packageTypes.length)]!;
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]!;
    const weight = Math.round((Math.random() * 50 + 1) * 10) / 10; // 0.1 to 50.0 kg
    
    // Generate realistic cost based on weight, service type, and distance
    let baseCost = weight * 25; // Base cost per kg
    if (serviceType === 'express') baseCost *= 1.5;
    if (serviceType === 'same_day') baseCost *= 2;
    if (packageType === 'fragile') baseCost *= 1.2;
    const totalCost = Math.round(baseCost + (Math.random() * 500 + 100)); // Add random base fee

    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

    bookings.push({
      customerId,
      driverId,
      pickupAddress: {
        address: `${Math.floor(Math.random() * 999) + 1} Pickup Street, ${pickupCity}`,
        contactName: `Contact ${i + 1}`,
        phone: `+1555${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
        city: pickupCity,
        postalCode: `${Math.floor(Math.random() * 900000) + 100000}`
      },
      deliveryAddress: {
        address: `${Math.floor(Math.random() * 999) + 1} Delivery Avenue, ${deliveryCity}`,
        contactName: `Recipient ${i + 1}`,
        phone: `+1555${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
        city: deliveryCity,
        postalCode: `${Math.floor(Math.random() * 900000) + 100000}`
      },
      packageType,
      weight,
      dimensions: {
        length: Math.round((Math.random() * 100 + 10) * 10) / 10,
        width: Math.round((Math.random() * 100 + 10) * 10) / 10,
        height: Math.round((Math.random() * 100 + 10) * 10) / 10
      },
      serviceType,
      pickupDate,
      baseCost: Math.round(baseCost),
      totalCost,
      status,
      specialInstructions: Math.random() > 0.6 ? `Special handling required for ${packageType}` : undefined,
      insurance: Math.random() > 0.7
    });
  }

  return bookings;
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to the database
    await connectDB();
    
    console.log('🗑️ Cleaning existing seed data...');
    
    // Remove existing users and addresses (only the ones we're about to create)
    const emailsToRemove = [...seedUsers.map(user => user.email), ...seedDrivers.map(driver => driver.email)];
    const existingUsers = await User.find({ email: { $in: emailsToRemove } });
    const userIdsToRemove = existingUsers.map(user => user._id);
    
    // Remove existing drivers
    const existingDrivers = await Driver.find({ email: { $in: seedDrivers.map(d => d.email) } });
    const driverIdsToRemove = existingDrivers.map(driver => driver._id);
    
    if (userIdsToRemove.length > 0) {
      await Address.deleteMany({ userId: { $in: userIdsToRemove } });
      await Booking.deleteMany({ customerId: { $in: userIdsToRemove } });
      await User.deleteMany({ _id: { $in: userIdsToRemove } });
      console.log(`🗑️ Removed ${userIdsToRemove.length} existing users and their data`);
    }
    
    if (driverIdsToRemove.length > 0) {
      await Booking.updateMany(
        { driverId: { $in: driverIdsToRemove } },
        { $unset: { driverId: 1 } }
      );
      await Driver.deleteMany({ _id: { $in: driverIdsToRemove } });
      console.log(`🗑️ Removed ${driverIdsToRemove.length} existing drivers`);
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

    console.log('🚚 Creating drivers...');
    const createdDrivers: any[] = [];

    // Create drivers
    for (const driverData of seedDrivers) {
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(driverData.password, salt);

      const driver = new Driver({
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        email: driverData.email,
        password: hashedPassword,
        phone: driverData.phone,
        licenseNumber: driverData.licenseNumber,
        licenseExpiry: driverData.licenseExpiry,
        experience: driverData.experience,
        vehicle: driverData.vehicle,
        status: driverData.status,
        rating: driverData.rating,
        totalDeliveries: driverData.totalDeliveries,
        documents: driverData.documents,
        availability: driverData.availability,
        currentLocation: driverData.currentLocation
      });

      const savedDriver = await driver.save();
      createdDrivers.push(savedDriver);
      
      console.log(`✅ Created driver: ${driverData.firstName} ${driverData.lastName} (${driverData.email})`);
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

    console.log('📦 Creating bookings...');
    
    // Get customer and driver IDs
    const customerIds = createdUsers
      .filter(user => user.userType === 'customer')
      .map(user => user._id.toString());
    const driverIds = createdDrivers.map(driver => driver._id.toString());
    
    const bookingsData = generateBookings(customerIds, driverIds);
    let totalBookings = 0;
    
    for (const bookingData of bookingsData) {
      const booking = new Booking({
        customerId: bookingData.customerId,
        driverId: bookingData.driverId,
        pickupAddress: bookingData.pickupAddress,
        deliveryAddress: bookingData.deliveryAddress,
        packageType: bookingData.packageType,
        weight: bookingData.weight,
        dimensions: bookingData.dimensions,
        serviceType: bookingData.serviceType,
        pickupDate: bookingData.pickupDate,
        baseCost: bookingData.baseCost,
        totalCost: bookingData.totalCost,
        status: bookingData.status,
        specialInstructions: bookingData.specialInstructions,
        insurance: bookingData.insurance,
        createdAt: bookingData.pickupDate
      });

      await booking.save();
      totalBookings++;
    }
    
    console.log(`✅ Created ${totalBookings} bookings`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users created: ${createdUsers.length}`);
    console.log(`   🚚 Drivers created: ${createdDrivers.length}`);
    console.log(`   🏠 Addresses created: ${totalAddresses}`);
    console.log(`   📦 Bookings created: ${totalBookings}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('📝 Customer Users:');
    console.log('   📧 vikas@gmail.com / Password@123');
    console.log('   📧 farhan@gmail.com / Password@123');
    console.log('   📧 priya@gmail.com / Password@123');
    console.log('   📧 rahul@gmail.com / Password@123');
    console.log('🚚 Driver Users:');
    console.log('   📧 rajesh.driver@gmail.com / Driver@123');
    console.log('   📧 amit.driver@gmail.com / Driver@123');
    console.log('   📧 suresh.driver@gmail.com / Driver@123');
    console.log('   📧 mohan.driver@gmail.com / Driver@123');
    console.log('   📧 ravi.driver@gmail.com / Driver@123');
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
