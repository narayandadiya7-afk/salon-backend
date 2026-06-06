import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import UserValidations from "../validations/uservalidation";
import { authenticate, authorize, optionalAuthenticate, requirePermission, resolveTenant } from "../middleware/tenantMiddleware";
import { UserRole } from "@prisma/client";

import {
  getState,
  getCountry,
  getDistrict,
  addMenuHierarchy,
  getMenuHierarchy,
  createConfigGroup,
  createConfigParam,
} from "../controllers/configController";

import {
  signIn,
  signUp,
  getUsers,
  deleteUser,
  getSpecificUserData,
} from "../controllers/userController";

import {
  getRoles,
  addEditRole,
  getSpecificRole,
} from "../controllers/roleController";

// ─── New Salon SaaS Controllers ───────────────────────────────────────────────
import { register, login, getProfile, refresh, logout } from "../controllers/authController";

import {
  getSalonBySlug,
  getOwnerSalon,
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
  assignTenantRole,
  listTenantRoles,
  saveTenantRole,
} from "../controllers/rbacController";


const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY routes (kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

router.post("/signUp", signUp);
router.post("/GetUserList", authMiddleware, getUsers);
router.delete("/users/:id", authMiddleware, deleteUser);
router.post("/signIn", UserValidations.signInValidation, signIn);
router.post("/GetSpecificUser", authMiddleware, getSpecificUserData);

router.post("/getState", getState);
router.post("/getCountry", getCountry);
router.post("/getDistrict", getDistrict);
router.post("/createConfigGroup", createConfigGroup);
router.post("/createConfigParam", createConfigParam);
router.post("/getMenuHierarchy", authMiddleware, getMenuHierarchy);
router.post("/addMenuHierarchy", authMiddleware, addMenuHierarchy);

router.post("/getRoleList", authMiddleware, getRoles);
router.post("/addEditRole", authMiddleware, addEditRole);
router.post("/getSpecificRole", authMiddleware, getSpecificRole);

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
router.get("/owner/salon", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), getOwnerSalon);
router.put("/owner/salons/:salonId", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), updateSalon);
router.put("/owner/salons/:salonId/working-hours", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), updateWorkingHours);

// Services management
router.post("/owner/salons/:salonId/services", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("services.manage"), createService);
router.get("/owner/salons/:salonId/services", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), (req, res) => {
  req.query.includeInactive = "true";
  return getServices(req, res);
});
router.put("/owner/salons/:salonId/services/:serviceId", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("services.manage"), updateService);
router.delete("/owner/salons/:salonId/services/:serviceId", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("services.manage"), deleteService);

// Appointments management
router.get("/owner/salons/:salonId/appointments", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), getSalonAppointments);
router.put("/owner/salons/:salonId/appointments/:appointmentId/status", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("bookings.edit"), updateAppointmentStatus);

router.get("/owner/salons/:salonId/roles", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("roles.manage"), listTenantRoles);
router.post("/owner/salons/:salonId/roles", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("roles.manage"), saveTenantRole);
router.put("/owner/salons/:salonId/roles/:roleId", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("roles.manage"), saveTenantRole);
router.post("/owner/salons/:salonId/roles/assign", authenticate, authorize(UserRole.SALON_OWNER, UserRole.ADMIN), requirePermission("roles.manage"), assignTenantRole);

// ─── Payment Routes ───────────────────────────────────────────────────────────
router.post("/payments/create-order", authenticate, createOrder);
router.post("/payments/verify", authenticate, verifyPayment);
router.post("/payments/test-success", authenticate, testPaymentSuccess);
router.post("/payments/webhook", handleWebhook); // No auth — Razorpay calls this
router.get("/payments/history", authenticate, getPaymentHistory);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/admin/salons", authenticate, authorize(UserRole.ADMIN), getAllSalons);
router.get("/superadmin/tenants", authenticate, authorize(UserRole.ADMIN), getAllSalons);

export default router;
