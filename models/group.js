const db = require("../db");
const { BadRequestError } = require("../utils/errors");
const { fetchUserByEmail } = require('./user')

class Group {
  static async getGroups(showImgUrls = true) {
    let groups = []
    let groupsIds = await db.query(`SELECT id FROM groups`)
    groupsIds = groupsIds.rows
    for (const el of groupsIds) {
      const { id } = el
      const group = await this.fetchGroupByGroupId(id, showImgUrls)
      groups.push(group)
    }
    return groups
  }
  static async getGroupsForUser(user, showImgUrls) {
    const { email } = user
    if (!email) throw new BadRequestError("no email man");
    let groups = await db.query(
      `SELECT groups.* FROM groups_users JOIN users ON groups_users.user_id = users.id 
      JOIN groups ON groups_users.group_id = groups.id
       WHERE users.email = $1;`,
      [email.toLowerCase()]
    );
    groups = groups.rows

    const detailedGroups = []
    for (const group of groups) {
      const { id } = group
      const gettingGroup = await this.fetchGroupByGroupId(id, showImgUrls)
      detailedGroups.push(gettingGroup)
    }

    return detailedGroups;
  }
  static async getUsersForGroup(groupId, showImgUrls = true) {
    groupId = Number(groupId);
    if (isNaN(groupId)) throw new BadRequestError("groupid NaN");

    let group = await db.query('SELECT * FROM groups WHERE id = $1;', [groupId])
    group = group.rows[0]

    group.users = []
    // id | name | email | password | imgurl | phone_number | about_me | created_at
    let users = await db.query(`
      SELECT 
      *
       FROM users 
      JOIN groups_users ON groups_users.user_id = users.id
        WHERE groups_users.group_id = $1
    `, [group.id])
    // console.log('userrrr',users.rows[0]);
    // let users = await db.query(`
    //   SELECT * FROM users 
    //   JOIN groups_users ON groups_users.user_id = users.id
    //     WHERE groups_users.group_id = $1
    // `, [group.id])
    for (const user of users.rows) {
      group.users.push(user)
    }

    const detailedGroup = await this.fetchGroupByGroupId(group.id, showImgUrls)

    return detailedGroup
  }
  static async createGroup(group) {

    const possibleFields = [
      "name",
      "description",
      "date_time",
      "capacity",
      "created_by"
    ];


    const actualFields = {};
    for (const field of possibleFields) {
      if (group[field]) {
        actualFields[field] = group[field];
      }
    }

    if (!Object.keys(actualFields).length)
      throw new BadRequestError("no fields");


    const query = `
      INSERT INTO groups ( ${Object.keys(actualFields)} )
      VALUES ( ${Object.values(actualFields).map((el, idx) => (
      '$' + (idx + 1)
    ))} )
      RETURNING *
    `;
    let insertedGroup = await db.query(query, [...Object.values(actualFields)]);
    insertedGroup = insertedGroup.rows[0]

    const insertedGroupDetailed = this.fetchGroupByGroupId(insertedGroup.id)

    return insertedGroupDetailed;
  }
  static async addUserToGroup(user, groupId, isDriver, showImgUrls = true) {

    groupId = Number(groupId);
    if (isNaN(groupId)) throw new BadRequestError("groupid NaN");

    const { email } = user;
    if (!email) throw new BadRequestError("no email");

    const groupExists = await db.query(`
        SELECT 1 FROM groups WHERE id = $1
      `, [groupId]
    );
    if (!groupExists.rows.length)
      throw new BadRequestError("group doesn't exist");

    const userInGroup = await db.query(
      `SELECT 1 FROM groups_users 
      WHERE user_id = 
      (SELECT id FROM users WHERE email = $1)
      AND group_id = $2;`,
      [email.toString().toLowerCase(), groupId]
    );
    if (userInGroup.rows.length)
      throw new BadRequestError("user already in group");

    const query = `
      INSERT INTO groups_users(group_id, user_id, is_driver)
      VALUES ($1, (
        SELECT id FROM users WHERE email = $2
      ), $3)
      RETURNING *
    `;
    // console.log('q',query,[groupId, email.toString().toLowerCase(), isDriver]);
    const group = await db.query(query,
      [groupId, email.toString().toLowerCase(), isDriver]);
    // console.log('group',group.rows);


    const groupInfo = await this.fetchGroupByGroupId(groupId, showImgUrls)


    return groupInfo;
  }

  static async removeUserFromGroup(email, groupId) {
    groupId = Number(groupId);
    if (isNaN(groupId)) throw new BadRequestError("groupid NaN");



    if (!email) throw new BadRequestError("no email");

    const groupExists = await db.query(
      `
        SELECT 1 FROM groups WHERE id = $1
      `,
      [groupId]
    );

    if (!groupExists.rows.length)
      throw new BadRequestError("group doesn't exist");

    const userInGroup = await db.query(
      `SELECT 1 FROM groups_users 
      WHERE user_id = 
      (SELECT id FROM users WHERE email = $1)
      AND group_id = $2;`,
      [email.toString().toLowerCase(), groupId]
    );
    if (!userInGroup.rows.length)
      throw new BadRequestError("user not in group");

    const deletingGroup = await db.query(`
      DELETE FROM groups_users
       WHERE user_id = 
       (SELECT id FROM users WHERE email = $1)
       AND group_id = $2
       RETURNING *;
    `, [email.toString().toLowerCase(), groupId])

    const deletedGroup = await db.query(`
      SELECT * FROM groups
      WHERE id = $1
    `, [groupId])

    return deletedGroup.rows[0];
  }
  static async updateGroupInfo(groupId, info) {
    if (groupId == null || info == null)
      throw new BadRequestError('need groupId and info')

    const possibleFields = [
      "name",
      "description",
      "date_time",
      "capacity",
      "created_by"
    ];
    const variableSets = []

    for (let field in info) {
      if (!possibleFields.includes(field))
        delete info[field]
    }

    const keys = Object.keys(info)
    const values = []
    let sqlNum = 2
    for (let i = 0; i < keys.length; i++) {
      variableSets.push(`${keys[i]} = $${sqlNum}`)
      values.push(info[keys[i]])

      sqlNum++
    }

    if (!variableSets.length)
      throw new BadRequestError('req body not sufficent')

    const query = `
      UPDATE groups SET
      ${variableSets}
      WHERE id = $1
      RETURNING *
    `
    let updatedGroup = await db.query(
      query, [groupId, ...values]
    )

    return updatedGroup.rows[0]

  }

 
  static async fetchGroupByGroupId(groupId, showImgUrls = true) {
    if (!groupId) throw new BadRequestError('no groupid')
    if (isNaN(groupId))
      throw new BadRequestError('groupId is ' + groupId + ' is not a number, type: ' + typeof groupId)

    // check if group exists by id
    let group = await db.query(`
      SELECT * FROM groups WHERE id = $1
    `, [groupId])
    group = group.rows
    if (!group.length)
      throw new BadRequestError('group doesnt exist')
    group = group[0]

    // get users for group
    let users = await db.query(`
        SELECT users.*, groups_users.is_driver FROM users 
        JOIN groups_users ON groups_users.user_id = users.id
         WHERE groups_users.group_id = $1
    `, [groupId])
    users = users.rows
    group.users = users

    let query;
    let driverImgUrl = await db.query(query = `
      SELECT users.imgurl FROM users
      JOIN groups_users ON groups_users.user_id = users.id
      WHERE groups_users.group_id = $1
      AND is_driver = true
    `, [groupId])
    // console.log('qer',query);
    // console.log('gid',groupId);

    driverImgUrl = driverImgUrl.rows?.[0]?.imgurl
    group.driverImgUrl = driverImgUrl || ''
    // console.log('driv',group.driverImgUrl);


    if (!showImgUrls) {
      group.driverImgUrl = ''
      for (const user of group.users)
        user.imgurl = ''
    }
    // console.log('g',group);
    return group
  }
  static async deleteGroupById(groupId) {
    if (isNaN(groupId)) throw new BadRequestError('not a number')

    let group = await db.query(`
      SELECT * FROM groups WHERE id = $1
    `, [groupId])
    group = group.rows
    if (!group.length)
      return new BadRequestError('group doesnt exist')

    let deletedGroup = await db.query(`
      DELETE FROM groups
      WHERE id = $1
      RETURNING *
    `, [groupId])

    return deletedGroup.rows[0]


  }
  // bulletin org
  static async getOrgTripsByEmail(email) {

    if (!email || typeof email !== 'string')
      throw new BadRequestError('string needed for email')
    if (email.indexOf('@') < 0)
      throw new BadRequestError('no @')

    const org = email.substr(email.indexOf('@') + 1)
    let orgGroups = await db.query(
      `SELECT groups.id FROM
       groups_users 
      JOIN groups
      ON groups_users.group_id = groups.id
      WHERE groups_users.is_driver = true
      AND groups.org_name = $1`
      , [org]);
    orgGroups = orgGroups.rows

    console.log('orgGroups');
    console.log(orgGroups);

    // orgGroups = this.sanitizeTripsByOrg(orgGroups, email)

    let orgTrips = []
    for (const group of orgGroups) {
      const newGroup = await this.fetchGroupByGroupId(group.id)
      orgTrips.push(newGroup)
    }
    return orgTrips
  }
  // mytrips org
  static async getOrgTripsForUser(email) {
    let groups = await this.getGroupsForUser({ email })

    for (const group of groups) {
      const driverEmail = await this.getDriverEmailByGroupId(group.id)
      group.email = driverEmail
    }

    // console.log(groups);
    groups = this.sanitizeTripsByOrg(groups, email)

    let orgTrips = []
    for (const group of groups) {
      const newGroup = await this.fetchGroupByGroupId(group.id)
      orgTrips.push(newGroup)
    }
    return orgTrips
  }
  static sanitizeTripsByOrg(trips, email) {
    const org = email.substring(email.indexOf('@') + 1)
    trips = trips.filter(g => {
      // delete g.imgurl
      // delete g.driverImgUrl
      // delete g.users
      // console.log(g);
      const elemEmail = g.email
      // console.log(elemEmail);

      const elemOrg = elemEmail.substr(elemEmail.indexOf('@') + 1)

      let a = `comparing '${elemOrg}' with '${org}'`
      console.log(a.red);


      return elemOrg === org
    })
    return trips
  }
  static async getDriverEmailByGroupId(groupId) {
    const groupExists = this.doesGroupExist(groupId)
    if (!groupExists)
      throw new BadRequestError('group doesn\'t exist')

    let query
    let id = await db.query(query = `
      SELECT users.email 
      FROM groups_users
      JOIN users
      ON groups_users.user_id = users.id
      JOIN groups
      ON groups_users.group_id = groups.id
      WHERE groups.id = $1
      AND groups_users.is_driver = true;
    `, [groupId])
    id = id.rows
    // console.log(query.green);
    // console.log('gid', groupId);
    // console.log('id'.green);
    // console.log(id);
    if (!id.length)
      return null
    if (id.length > 1)
      return new BadRequestError('more than 1 driver')

    id = id[0].email

    return id


  }
  static async doesGroupExist(gid) {
    const groupExists = await db.query(`
        SELECT 1 FROM groups WHERE id = $1
      `, [gid]
    );
    return groupExists.rows.length !== 0
  }
  static async doesUserExist(uid) {
    const userExists = await db.query(`
        SELECT 1 FROM users 
        WHERE
        id = $1
      `, [uid]
    );
    return userExists.rows.length !== 0
  }



}

module.exports = Group;
