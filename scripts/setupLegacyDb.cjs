const { sequelize } = require('../dist/database/db');

async function setup() {
  try {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "userManagement"`);

    console.log('Creating tables...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "userManagement"."menuhierarchy" (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255),
        disp_name VARCHAR(255),
        parent_id INTEGER DEFAULT 0,
        menu_unique_id VARCHAR(100),
        entity_url VARCHAR(255) NOT NULL DEFAULT '',
        description TEXT,
        is_active SMALLINT NOT NULL DEFAULT 1,
        org_id INTEGER NOT NULL DEFAULT 1,
        icon_name VARCHAR(100),
        display_order INTEGER DEFAULT 0,
        createdon TIMESTAMP DEFAULT NOW(),
        createdby BIGINT DEFAULT 0,
        updatedon TIMESTAMP,
        updatedby BIGINT DEFAULT 0,
        isdeleted SMALLINT NOT NULL DEFAULT 0,
        deletedon TIMESTAMP,
        deletedby BIGINT DEFAULT 0
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "userManagement"."privileges_master" (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        privilege_unique_id VARCHAR(255) NOT NULL UNIQUE,
        description VARCHAR(500),
        menu_id BIGINT NOT NULL DEFAULT 0,
        created_on TIMESTAMP DEFAULT NOW(),
        created_by BIGINT NOT NULL DEFAULT 0,
        updated_on TIMESTAMP,
        updated_by BIGINT NOT NULL DEFAULT 0,
        is_deleted SMALLINT NOT NULL DEFAULT 0,
        deleted_on TIMESTAMP,
        deleted_by BIGINT NOT NULL DEFAULT 0
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "userManagement"."role_privileges_mapping" (
        id BIGSERIAL PRIMARY KEY,
        role_id BIGINT NOT NULL DEFAULT 0,
        privilege_id BIGINT NOT NULL DEFAULT 0,
        created_on TIMESTAMP DEFAULT NOW(),
        created_by BIGINT NOT NULL DEFAULT 0,
        updated_on TIMESTAMP,
        updated_by BIGINT NOT NULL DEFAULT 0,
        is_deleted SMALLINT NOT NULL DEFAULT 0,
        deleted_on TIMESTAMP,
        deleted_by BIGINT NOT NULL DEFAULT 0
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "userManagement"."role_master" (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role_unique_id VARCHAR(255) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_on TIMESTAMP DEFAULT NOW(),
        created_by BIGINT,
        updated_on TIMESTAMP,
        updated_by BIGINT,
        is_deleted SMALLINT NOT NULL DEFAULT 0,
        deleted_on TIMESTAMP,
        deleted_by BIGINT
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "userManagement"."user_master" (
        id BIGSERIAL PRIMARY KEY,
        role_id BIGINT NOT NULL DEFAULT 0,
        full_name VARCHAR(255) NOT NULL DEFAULT '',
        email_id VARCHAR(255) NOT NULL DEFAULT '',
        mobile_number VARCHAR(100) NOT NULL DEFAULT '',
        password VARCHAR(200) NOT NULL DEFAULT '',
        is_active SMALLINT NOT NULL DEFAULT 1,
        created_on TIMESTAMP DEFAULT NOW(),
        created_by BIGINT NOT NULL DEFAULT 0,
        updated_on TIMESTAMP,
        updated_by BIGINT NOT NULL DEFAULT 0,
        is_deleted SMALLINT NOT NULL DEFAULT 0,
        deleted_on TIMESTAMP,
        deleted_by BIGINT NOT NULL DEFAULT 0,
        user_name VARCHAR(500),
        display_name VARCHAR(500),
        org_id INTEGER DEFAULT 0,
        is_master SMALLINT DEFAULT 0
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "userManagement"."user_details" (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL DEFAULT 0,
        full_name VARCHAR(255),
        email_id VARCHAR(100),
        mobile_number VARCHAR(30),
        country_id BIGINT,
        state_id BIGINT,
        district_id BIGINT,
        gender SMALLINT,
        date_of_birth DATE,
        zip_code VARCHAR(20),
        address VARCHAR(500),
        created_on TIMESTAMP DEFAULT NOW(),
        created_by BIGINT NOT NULL DEFAULT 0,
        updated_on TIMESTAMP,
        updated_by BIGINT NOT NULL DEFAULT 0,
        is_deleted SMALLINT NOT NULL DEFAULT 0,
        deleted_on TIMESTAMP,
        deleted_by BIGINT NOT NULL DEFAULT 0
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "config_group" (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255),
        description VARCHAR(1000),
        group_unique_id VARCHAR(20),
        createdon TIMESTAMP DEFAULT NOW(),
        createdby BIGINT,
        updatedon TIMESTAMP,
        updatedby BIGINT,
        isdeleted SMALLINT NOT NULL DEFAULT 0,
        deletedon TIMESTAMP,
        deletedby BIGINT
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "config_param" (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255),
        description VARCHAR(1000),
        group_id BIGINT,
        param_unique_id VARCHAR(20),
        control_id INTEGER NOT NULL DEFAULT 1,
        ref_group_id INTEGER NOT NULL DEFAULT 0,
        createdon TIMESTAMP DEFAULT NOW(),
        createdby BIGINT,
        updatedon TIMESTAMP,
        updatedby BIGINT,
        isdeleted SMALLINT NOT NULL DEFAULT 0,
        deletedon TIMESTAMP,
        deletedby BIGINT
      )
    `);

    const existingMenus = (await sequelize.query('SELECT COUNT(*) as cnt FROM "userManagement"."menuhierarchy"', { type: 'SELECT' }))[0];
    if (parseInt(existingMenus.cnt) > 0) {
      console.log(`Menu hierarchy already has ${existingMenus.cnt} records, skipping full seed.`);
      await sequelize.close();
      return;
    }

    console.log('Seeding menu hierarchy...');

    await sequelize.query(`
      INSERT INTO "userManagement"."menuhierarchy" (name, disp_name, parent_id, entity_url, description, is_active, org_id, icon_name, display_order, createdby)
      VALUES
        ('dashboard', 'Dashboard', 0, 'dashboard', '', 1, 1, 'dashboard', 1, 1),
        ('user-management', 'User Management', 0, '', '', 1, 1, 'users', 2, 1),
        ('users', 'Users', 0, 'users', '', 1, 1, 'team', 3, 1),
        ('roles', 'Roles', 0, 'roles', '', 1, 1, 'safety', 4, 1),
        ('configuration', 'Configuration', 0, '', '', 1, 1, 'settings', 5, 1),
        ('config-group', 'Config Groups', 0, 'config-group', '', 1, 1, 'group', 6, 1),
        ('config-param', 'Config Parameters', 0, 'config-param', '', 1, 1, 'list', 7, 1)
    `);

    await sequelize.query(`UPDATE "userManagement"."menuhierarchy" SET menu_unique_id = CONCAT('menu-', id)`);

    const menuRows = await sequelize.query('SELECT id, name FROM "userManagement"."menuhierarchy"', { type: 'SELECT' });
    const menuMap = {};
    for (const row of menuRows) {
      menuMap[row.name] = row.id;
    }

    await sequelize.query(`UPDATE "userManagement"."menuhierarchy" SET parent_id = $1 WHERE id = $2`, {
      bind: [menuMap['user-management'], menuMap['users']],
    });
    await sequelize.query(`UPDATE "userManagement"."menuhierarchy" SET parent_id = $1 WHERE id = $2`, {
      bind: [menuMap['user-management'], menuMap['roles']],
    });
    await sequelize.query(`UPDATE "userManagement"."menuhierarchy" SET parent_id = $1 WHERE id = $2`, {
      bind: [menuMap['configuration'], menuMap['config-group']],
    });
    await sequelize.query(`UPDATE "userManagement"."menuhierarchy" SET parent_id = $1 WHERE id = $2`, {
      bind: [menuMap['configuration'], menuMap['config-param']],
    });

    console.log('Seeding privileges master...');

    await sequelize.query(`
      INSERT INTO "userManagement"."privileges_master" (name, privilege_unique_id, menu_id, description, created_by)
      VALUES
        ('View Dashboard', 'VIEWDASHBOARD', $1, 'View dashboard', 1),
        ('View Users', 'VIEWUSERS', $2, 'View users list', 1),
        ('Add/Edit Users', 'ADDEDITUSERS', $2, 'Create or edit users', 1),
        ('Delete Users', 'DELETEUSERS', $2, 'Delete users', 1),
        ('View Roles', 'VIEWROLES', $3, 'View roles list', 1),
        ('Add/Edit Roles', 'ADDEDITROLES', $3, 'Create or edit roles', 1),
        ('Delete Roles', 'DELETEROLES', $3, 'Delete roles', 1),
        ('View Config Groups', 'VIEWCONFIGGROUP', $4, 'View config groups', 1),
        ('Add/Edit Config Groups', 'ADDEDITCONFIGGROUP', $4, 'Create or edit config groups', 1),
        ('Delete Config Groups', 'DELETECONFIGGROUP', $4, 'Delete config groups', 1),
        ('View Config Params', 'VIEWCONFIGPARAM', $5, 'View config parameters', 1),
        ('Add/Edit Config Params', 'ADDEDITCONFIGPARAM', $5, 'Create or edit config parameters', 1),
        ('Delete Config Params', 'DELETECONFIGPARAM', $5, 'Delete config parameters', 1)
      ON CONFLICT (privilege_unique_id) DO NOTHING
    `, {
      bind: [
        menuMap['dashboard'],
        menuMap['users'],
        menuMap['roles'],
        menuMap['config-group'],
        menuMap['config-param'],
      ],
    });

    const existingRole = (await sequelize.query(
      'SELECT id FROM "userManagement"."role_master" WHERE role_unique_id = $1 LIMIT 1',
      { bind: ['SUPER_ADMIN'], type: 'SELECT' }
    ))[0];

    let roleId;
    if (!existingRole) {
      console.log('Seeding SUPER_ADMIN role...');
      const roleResult = await sequelize.query(
        `INSERT INTO "userManagement"."role_master" (name, role_unique_id, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id`,
        { bind: ['SUPER_ADMIN', 'SUPER_ADMIN', 'Super Admin with all privileges', 1] }
      );
      roleId = roleResult[0][0].id;

      const allPrivileges = await sequelize.query(
        'SELECT id FROM "userManagement"."privileges_master" WHERE is_deleted = 0',
        { type: 'SELECT' }
      );
      for (const p of allPrivileges) {
          await sequelize.query(
            'INSERT INTO "userManagement"."role_privileges_mapping" (role_id, privilege_id, created_by) VALUES ($1, $2, $3)',
            { bind: [roleId, p.id, 1] }
          );
      }
      console.log(`Assigned ${allPrivileges.length} privileges to SUPER_ADMIN role.`);
    } else {
      console.log('SUPER_ADMIN role already exists, skipping.');
    }

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Setup failed:', err);
  }
  await sequelize.close();
}

setup();
