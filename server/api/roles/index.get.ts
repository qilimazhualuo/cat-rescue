import { getAllRoles } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const roles = await getAllRoles()
    return roles
})
