import type { Access } from 'payload'

/** Grants access only to authenticated admin users. */
export const adminOnly: Access = ({ req }) => {
    return req.user?.role === 'admin'
}

/** Always allows access — used for server-side internal writes. */
export const serverSideAccess: Access = () => true

/** Denies all access from the API — used for server-written read-only records. */
export const neverAccess: Access = () => false
