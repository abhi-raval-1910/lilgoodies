const crypto = require('crypto');
const { supabaseRequest } = require('../_lib/supabase');

function packageId() {
    return crypto.randomBytes(12).toString('hex');
}

function slugPart(value, fallback) {
    const normalized = String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24);
    return normalized || fallback;
}

function packageShareSlug(recipient, sender) {
    const to = slugPart(recipient, 'friend');
    const from = slugPart(sender, 'someone');
    const suffix = crypto.randomBytes(4).toString('hex');
    return `${to}-from-${from}-${suffix}`;
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const body = request.body || {};
    if (!body.to || !body.from || !Array.isArray(body.items) || body.items.length === 0) {
        return response.status(400).json({ error: 'Recipient, sender, and at least one item are required' });
    }

    let status = 'pending';
    if (body.status === 'free') {
        const code = String(body.couponCode || '').trim().toUpperCase();
        const validCodes = [
            'LOVE$100',
            ...String(process.env.FREE_COUPON_CODES || '').split(',').map(value => value.trim().toUpperCase()).filter(Boolean)
        ];
        if (!code || !validCodes.includes(code)) return response.status(403).json({ error: 'Invalid coupon code' });
        status = 'free';
    }
    if (body.status === 'paid') {
        const { orderId, paymentId, signature } = body.payment || {};
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const expected = secret && orderId && paymentId ? crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex') : '';
        if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)))) {
            return response.status(403).json({ error: 'Payment verification required' });
        }
        status = 'paid';
    }

    const recipient = String(body.to).slice(0, 120);
    const sender = String(body.from).slice(0, 120);
    const id = packageId();
    const shareSlug = packageShareSlug(recipient, sender);
    try {
        await supabaseRequest('packages', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
                id,
                share_slug: shareSlug,
                recipient,
                sender,
                items: body.items,
                amount: Number(body.amount || 0),
                status,
                coupon_code: body.couponCode || null
            })
        });
        const sharePath = `/preview.html?id=${encodeURIComponent(shareSlug)}`;
        return response.status(201).json({ id, shareId: shareSlug, url: sharePath });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: `Could not create package: ${error.message}` });
    }
};