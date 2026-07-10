import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import UserValidations from "../validations/uservalidation";
import { authenticate, authorize, optionalAuthenticate, requirePermission, resolveTenant, ROLES } from "../middleware/tenantMiddleware";

import {
  getState,
  getCountry,
  getDistrict,
  addMenuHierarchy,
  getMenuHierarchy,
  createConfigGroup,
  createConfigParam,
  getConfigGroupList,
  getSpecificConfigGroup,
  deleteConfigGroup,
  addEditConfigGroup,
  getConfigParamList,
  getSpecificConfigParam,
  addEditConfigParam,
  deleteConfigParam,
} from "../controllers/configController";

import {
  signIn,
  signUp,
  getUsers,
  deleteUser,
  getSpecificUserData,
  addEditUser,
} from "../controllers/userController";

import {
  getRoles,
  addEditRole,
  getSpecificRole,
  deleteRole,
} from "../controllers/roleController";

// ─── New Salon SaaS Controllers ───────────────────────────────────────────────
import { register, login, getProfile, refresh, logout } from "../controllers/authController";

import {
  getSalonBySlug,
  getOwnerSalon,
  checkSlug,
  updateSalon,
  updateWorkingHours,
  getAllSalons,
  createService,
  getServices,
  updateService,
  deleteService,
  getAvailableSlots,
  bookAppointment,
  getSalonAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from "../controllers/salonController";

import {
  createOrder,
  verifyPayment,
  testPaymentSuccess,
  handleWebhook,
  getPaymentHistory,
} from "../controllers/paymentController";

import {
  listTenantRoles,
  saveTenantRole,
  assignRole,
} from "../controllers/rbacController";


const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY routes (kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

router.post("/signUp", signUp);
router.post("/GetUserList", authMiddleware, getUsers);
router.delete("/users/:id", authMiddleware, deleteUser);
router.post("/deleteUser", authMiddleware, deleteUser);
router.post("/addEditUser", authMiddleware, addEditUser);
router.post("/signIn", UserValidations.signInValidation, signIn);
router.post("/GetSpecificUser", authMiddleware, getSpecificUserData);

router.post("/getState", getState);
router.post("/getCountry", getCountry);
router.post("/getDistrict", getDistrict);
router.post("/createConfigGroup", createConfigGroup);
router.post("/createConfigParam", createConfigParam);
router.post("/getConfigGroupList", authMiddleware, getConfigGroupList);
router.post("/getSpecificConfigGroup", authMiddleware, getSpecificConfigGroup);
router.post("/addEditConfigGroup", authMiddleware, addEditConfigGroup);
router.post("/deleteConfigGroup", authMiddleware, deleteConfigGroup);
router.post("/getConfigParamList", authMiddleware, getConfigParamList);
router.post("/getSpecificConfigParam", authMiddleware, getSpecificConfigParam);
router.post("/addEditConfigParam", authMiddleware, addEditConfigParam);
router.post("/deleteConfigParam", authMiddleware, deleteConfigParam);
router.post("/getMenuHierarchy", authMiddleware, getMenuHierarchy);
router.post("/addMenuHierarchy", authMiddleware, addMenuHierarchy);

router.post("/getRoleList", authMiddleware, getRoles);
router.post("/addEditRole", authMiddleware, addEditRole);
router.post("/getSpecificRole", authMiddleware, getSpecificRole);
router.post("/deleteRole", authMiddleware, deleteRole);

// ─────────────────────────────────────────────────────────────────────────────
// NEW SALON SAAS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Auth (Prisma-based)
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);
router.get("/auth/profile", authenticate, getProfile);

// ─── Public Salon Routes (tenant website) ────────────────────────────────────
router.get("/salons/check-slug/:slug", checkSlug);
router.get("/salons/slug/:slug", getSalonBySlug);
router.get("/salons/:salonId/services", getServices);
router.get("/salons/:salonId/slots", getAvailableSlots);
router.post("/salons/:salonId/book", optionalAuthenticate, bookAppointment);
router.post("/appointments/:appointmentId/cancel", cancelAppointment);

// Tenant-aware public aliases: custom domain/subdomain/header/slug resolution
router.get("/tenant/:slug", resolveTenant, getSalonBySlug);
router.get("/tenant/:slug/services", resolveTenant, (req, res) => {
  req.params.salonId = req.tenant!.id;
  return getServices(req, res);
});
router.get("/tenant/:slug/slots", resolveTenant, (req, res) => {
  req.params.salonId = req.tenant!.id;
  return getAvailableSlots(req, res);
});
router.post("/tenant/:slug/book", resolveTenant, optionalAuthenticate, (req, res) => {
  req.body = { ...req.body, tenantId: req.tenant!.id, salonId: req.tenant!.id };
  return bookAppointment(req, res);
});

// ─── Salon Owner Routes (protected) ──────────────────────────────────────────
router.get("/owner/salon", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), getOwnerSalon);
router.put("/owner/salons/:salonId", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), updateSalon);
router.put("/owner/salons/:salonId/working-hours", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), updateWorkingHours);

// Services management
router.post("/owner/salons/:salonId/services", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("services.manage"), createService);
router.get("/owner/salons/:salonId/services", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), (req, res) => {
  req.query.includeInactive = "true";
  return getServices(req, res);
});
router.put("/owner/salons/:salonId/services/:serviceId", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("services.manage"), updateService);
router.delete("/owner/salons/:salonId/services/:serviceId", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("services.manage"), deleteService);

// Appointments management
router.get("/owner/salons/:salonId/appointments", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), getSalonAppointments);
router.put("/owner/salons/:salonId/appointments/:appointmentId/status", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("bookings.edit"), updateAppointmentStatus);

router.get("/owner/salons/:salonId/roles", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("roles.manage"), listTenantRoles);
router.post("/owner/salons/:salonId/roles", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("roles.manage"), saveTenantRole);
router.put("/owner/salons/:salonId/roles/:roleId", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("roles.manage"), saveTenantRole);
router.post("/roles/assign", authenticate, authorize(ROLES.SALON_OWNER, ROLES.ADMIN), requirePermission("roles.manage"), assignRole);

// ─── Payment Routes ───────────────────────────────────────────────────────────
router.post("/payments/create-order", authenticate, createOrder);
router.post("/payments/verify", authenticate, verifyPayment);
router.post("/payments/test-success", authenticate, testPaymentSuccess);
router.post("/payments/webhook", handleWebhook); // No auth — Razorpay calls this
router.get("/payments/history", authenticate, getPaymentHistory);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/admin/salons", authenticate, authorize(ROLES.ADMIN), getAllSalons);
router.get("/superadmin/tenants", authenticate, authorize(ROLES.ADMIN), getAllSalons);

export default router;
