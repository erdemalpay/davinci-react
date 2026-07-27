# Retailer Order Request In-Delivery Action

## Goal

Allow a user to mark a retailer order request as in delivery from the retailer
order-requests table.

## API

Add a focused mutation to the existing
`src/utils/api/account/retailer.ts` module. It sends:

```http
PATCH /order/retailer-order-request/:orderId/status
Content-Type: application/json

{ "status": "indelivery" }
```

The `orderId` path parameter comes from the row's `orderId`, not its database
`_id`.

## User Interface

Add an `In Delivery` row action to
`src/components/retailer/RetailerOrderRequests.tsx`. The action is available
only when the row's current status is not `indelivery`. While the mutation is
pending, duplicate submissions are prevented.

On success, the retailer-order-request query is invalidated so the table shows
the backend status, and a success toast is displayed. On failure, the backend
error message is displayed using the project's existing toast pattern.

## Testing

Add focused tests that verify:

- The API request uses the row's `orderId`, the status endpoint, and the exact
  `{ status: "indelivery" }` payload.
- The action is available for other statuses and unavailable for an
  `indelivery` row.
- A successful update invalidates the retailer-order-request query.

Production verification includes the focused tests, conflict/format checks,
and the available build command. Any unrelated pre-existing build failure will
be reported rather than hidden.
