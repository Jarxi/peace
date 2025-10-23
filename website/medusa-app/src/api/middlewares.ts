import {
    defineMiddlewares,
    authenticate,
    validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostVendorCreateSchema } from "./vendors/route"
import { PostVendorStoreCreateSchema } from "./vendors/store/route"
import { PostVendorProductCreateSchema } from "./vendors/products/route"
import { PostVendorProductUpdateSchema } from "./vendors/products/[id]/route"
import { PostVendorMeUpdateSchema } from "./vendors/me/route"
import { PostChangePasswordSchema } from "./vendors/me/change-password/route"

export default defineMiddlewares({
    routes: [
        {
            matcher: "/admin/store-policies",
            method: ["GET", "POST"],
            middlewares: [
                authenticate("user", ["session", "bearer"]),
            ],
        },
        {
            matcher: "/admin/check-product-regions",
            method: ["GET"],
            middlewares: [],
        },
        {
            matcher: "/admin/check-product/:id",
            method: ["GET"],
            middlewares: [],
        },
        {
            matcher: "/admin/link-us-region",
            method: ["POST"],
            middlewares: [],
        },
        {
            matcher: "/import/products/shopify",
            method: ["POST"],
            bodyParser: {
                sizeLimit: "10mb",
            },
            middlewares: [
                authenticate(["user", "vendor"], ["session", "bearer"]),
            ],
        },
        {
            matcher: "/analyze/products/shopify",
            method: ["POST"],
            bodyParser: {
                sizeLimit: "10mb",
            },
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
            ],
        },
        {
            matcher: "/vendors",
            method: ["POST"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"], {
                    allowUnregistered: true,
                }),
                validateAndTransformBody(PostVendorCreateSchema),
            ],
        },
        {
            matcher: "/vendors/store",
            method: ["POST"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
                validateAndTransformBody(PostVendorStoreCreateSchema),
            ],
        },
        {
            matcher: "/vendors/products",
            method: ["POST"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
                validateAndTransformBody(PostVendorProductCreateSchema),
            ],
        },
        {
            matcher: "/vendors/products",
            method: ["DELETE"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
            ],
        },
        {
            matcher: "/vendors/products/:id",
            method: ["POST"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
                validateAndTransformBody(PostVendorProductUpdateSchema),
            ],
        },
        {
            matcher: "/vendors/me",
            method: ["POST"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
                validateAndTransformBody(PostVendorMeUpdateSchema),
            ],
        },
        {
            matcher: "/vendors/me/change-password",
            method: ["POST"],
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
                validateAndTransformBody(PostChangePasswordSchema),
            ],
        },
        {
            matcher: "/vendors/*",
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
            ],
        }
    ],
})