https://developers.openai.com/commerce/specs/feed

Our customer's product website needs to follow the spec of the above link

for example:
Attribute	Data Type	Supported Values	Description	Example	Requirement	Dependencies	Validation Rules
seller_name	String	—	Seller name	Example Store	Required / Display	—	Max 70 chars
seller_url	URL	RFC 1738	Seller page	https://example.com/store	Required	—	HTTPS preferred
seller_privacy_policy	URL	RFC 1738	Seller-specific policies	https://example.com/privacy	Required, if enabled_checkout is true	—	HTTPS preferred
seller_tos	URL	RFC 1738	Seller-specific terms of service	https://example.com/terms	Required, if enabled_checkout is true

