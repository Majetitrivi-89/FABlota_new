import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// Require Authentication and Admin Check
router.use(authenticate);

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
  try {
    const { data: roleData, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user.id)
      .single();

    if (error || (roleData.role !== 'super_admin' && roleData.role !== 'manufacturer')) {
       return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Role Verification Error' });
  }
};

// Route: Get All Users (Manufacturers and Retailers)
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        user_roles!inner(role)
      `);

    if (error) throw error;

    const manufacturers = data.filter(p => p.user_roles.role === 'manufacturer');
    const retailers = data.filter(p => p.user_roles.role === 'retailer');

    res.json({ manufacturers, retailers });
  } catch (err) {
    console.error('Error in /admin/users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Route: Get Statistics (Secure Admin Action)
router.get('/stats', checkAdmin, async (req, res) => {
  try {
    // Example of a privileged DB query via Supabase Admin SDK
    const { count: orderCount } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

    res.json({
        totalOrders: orderCount || 0,
        serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
