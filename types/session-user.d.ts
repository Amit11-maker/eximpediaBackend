import { Request } from "express"

interface SessionUser {
    user_id: string,
    account_id: string,
    first_name: string
    last_name: string
    email_id: string
    refresh_token: string
    role: string
    scope: string
    password: string
}

type RequestWithUser<ReqBody = any, P = object, ResBody = any, ReqQuery = qs.ParsedQs, Locals extends Record<string, any> = Record<string, any>> = Request<P, ResBody, ReqBody, ReqQuery, Locals> & { user: SessionUser }


interface CompanySearchPayload {
    tradeType: string
    country: string
    searchField: string
    searchTerm: string
    dateRange: {
        "startDate": string,
        "endDate": string
    },
    taxonomy_id: string,
    blCountry?: string
}