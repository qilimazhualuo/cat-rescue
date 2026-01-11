import { searchAdoptionApplications } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const query = getQuery(event)

    const result = await searchAdoptionApplications({
        cat_id: query.cat_id ? parseInt(query.cat_id as string) : undefined,
        status: query.status as string,
        applicant_name: query.applicant_name as string,
        applicant_phone: query.applicant_phone as string,
        page: parseInt(query.page as string) || 1,
        pageSize: parseInt(query.pageSize as string) || 20,
    })

    return result
})
