const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { BadRequestError, UnauthorizedError } = require("../utils/errors");

class User {
  static async login(credentials) {
    const requiredFields = ["email", "password"];
    requiredFields.forEach((property) => {
      if (!credentials.hasOwnProperty(property)) {
        throw new BadRequestError(`Missing ${property} in request body.`);
      }
    });
    const user = await User.fetchUserByEmail(credentials.email);
    if (user) {
      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (isValid) {
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  static async register(credentials) {
    const requiredFields = ["email", "password"];
    requiredFields.forEach((property) => {
      if (!credentials.hasOwnProperty(property)) {
        throw new BadRequestError(`Missing ${property} in request body.`);
      }
    });

    if (credentials.email.indexOf("@") <= 0) {
      throw new BadRequestError("Invalid email.");
    }
    if (credentials.email.indexOf("@") === credentials.email.length - 1) {
      throw new BadRequestError("Invalid email.");
    }
    const existingUser = await User.fetchUserByEmail(credentials.email);
    if (existingUser) {
      throw new BadRequestError(
        `A user already exists with email: ${credentials.email}`
      );
    }
    const hashedPassword = await bcrypt.hash(
        credentials.password,
        BCRYPT_WORK_FACTOR
      );
    const normalizedEmail = credentials.email.toLowerCase();

    const userResult = await db.query(
      `INSERT INTO users (email, password,
        name, imgurl )
       VALUES ($1, $2, $3, $4 )
       RETURNING *;
      `,
      [
        normalizedEmail,
        hashedPassword,
        credentials?.name || '',
        credentials?.imgurl || '',
      ]
    );

    const user = userResult.rows[0];
    return user
  }

  static async fetchUserByEmail(email) {
    if (!email) {
      throw new BadRequestError("No email provided");
    }
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await db.query(query, [email.toLowerCase()]);

    if (!result.rows.length)
      return null

    const user = result.rows[0];

    return user;
  }
  static async getAllUsers() {
    const res = await db.query(
      // `SELECT id,name,email,password,phone_number,created_at FROM users;`
      `SELECT * FROM users;`
    )
    return res.rows
  }


  static async updateUserInfo(email, info) {


    const possibleFields = ['id', 'name', 'email', 'password', 'imgurl', 'created_at', 'about_me', 'phone_number']
    const variableSets = []


    for (let field in info) {
      if (!possibleFields.includes(field))
        delete info[field]
    }

    const keys = Object.keys(info)
    const values = []
    let sqlNum = 2;
    for (let i = 0; i < keys.length; i++) {
      if (!possibleFields.includes(keys[i]))
        continue
      variableSets.push(`${keys[i]} = $${sqlNum}`)
      values.push(info[keys[i]])

      // if(keys[i] != 'imgurl')
      //   console.log('key', keys[i], 'value', info[keys[i]], typeof info[keys[i]], );
      sqlNum++
    }


    if (!variableSets.length)
      throw new BadRequestError('req body not sufficent')

    const query = `
      UPDATE users SET
      ${variableSets}
      WHERE email = $1
      RETURNING *
    `
    let updatedUser = await db.query(
      query, [email, ...values]
    )


    return updatedUser.rows[0]

  }

  static async getUserById(userId) {
    if (!userId || isNaN(userId))
      throw new BadRequestError('bad id')

    let user = await db.query(`
      SELECT * FROM users
      WHERE id = $1
    `, [userId])
    user = user.rows
    if (!user.length)
      throw new BadRequestError('no user with that id')

    return user[0]
  }
  static async deleteUserById(userId) {
    if (!userId || isNaN(userId))
      throw new BadRequestError('not a num')

    let userExists = await this.doesUserExist(userId)
    if (!userExists)
      throw new BadRequestError('user does not exist')

    let deletedUserInfo = []

    let deletedUser = await db.query(`
      DELETE FROM users
      WHERE id = $1
      RETURNING *
    `, [userId])
    deletedUserInfo.push(deletedUser.rows[0])

    let deleteJoinerRow = await db.query(`
      DELETE FROM groups_users
      WHERE user_id = $1
      RETURNING *
    `, [userId])
    deletedUserInfo.push(deleteJoinerRow.rows)

    return deletedUserInfo
  }
  static async doesUserExist(userId) {
    const user = await db.query(`
      SELECT 1 FROM users
      WHERE id = $1
    `, [userId])
    console.log(user.rows);
    return user.rows.length !== 0
  }

}

module.exports = User;
