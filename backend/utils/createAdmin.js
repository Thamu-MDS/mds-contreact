import User from '../models/User.js';

export const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created: username=admin, password=admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};