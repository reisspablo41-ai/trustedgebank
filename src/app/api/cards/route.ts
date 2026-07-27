import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API: Fetching cards for user:', user.id);

    // Fetch user's cards
    const { data: cards, error } = await supabase
      .from('cards')
      .select(
        'id, card_number, card_type, expiry_date, cvv, status, online_purchases, atm_withdrawals, contactless, daily_limit'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('API: Cards fetch result:', { cards, error });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching cards:', error);
      // Return empty array instead of 500 error if table doesn't exist
      return NextResponse.json({ cards: [] });
    }

    console.log(`API: Successfully fetched ${cards?.length || 0} cards`);

    return NextResponse.json({ cards: cards ?? [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update a card the caller owns: freeze/unfreeze and card controls.
 * Body: { card_id, status?, online_purchases?, atm_withdrawals?,
 *         contactless?, daily_limit? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { card_id } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'card_id required' }, { status: 400 });
    }

    // Whitelist the updatable fields — never trust the body wholesale, or a
    // caller could rewrite card_number / user_id.
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (body.status !== 'active' && body.status !== 'frozen') {
        return NextResponse.json(
          { error: "status must be 'active' or 'frozen'" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    for (const flag of [
      'online_purchases',
      'atm_withdrawals',
      'contactless',
    ] as const) {
      if (body[flag] !== undefined) {
        if (typeof body[flag] !== 'boolean') {
          return NextResponse.json(
            { error: `${flag} must be a boolean` },
            { status: 400 }
          );
        }
        updates[flag] = body[flag];
      }
    }

    if (body.daily_limit !== undefined) {
      const limit = Number(body.daily_limit);
      if (!Number.isFinite(limit) || limit < 0) {
        return NextResponse.json(
          { error: 'daily_limit must be a non-negative number' },
          { status: 400 }
        );
      }
      updates.daily_limit = limit;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes supplied' }, { status: 400 });
    }

    // .eq('user_id') is belt-and-braces alongside RLS.
    const { data: updated, error: updateError } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', card_id)
      .eq('user_id', user.id)
      .select(
        'id, card_number, card_type, expiry_date, cvv, status, online_purchases, atm_withdrawals, contactless, daily_limit'
      )
      .single();

    if (updateError) {
      console.error('Error updating card:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Freeze/unfreeze is security-relevant, so it gets an alert.
    if (updates.status) {
      const frozen = updates.status === 'frozen';
      await supabase.from('alerts').insert({
        user_id: user.id,
        type: 'security',
        title: frozen ? 'Card frozen' : 'Card unfrozen',
        message: frozen
          ? `Your ${updated.card_type} card ending ${updated.card_number?.slice(-4) ?? '****'} has been frozen. New transactions will be declined.`
          : `Your ${updated.card_type} card ending ${updated.card_number?.slice(-4) ?? '****'} is active again.`,
        severity: frozen ? 'warning' : 'success',
        is_read: false,
      });
    }

    return NextResponse.json({ card: updated });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { card_type } = body;

    if (!card_type) {
      return NextResponse.json(
        { error: 'Card type required' },
        { status: 400 }
      );
    }

    console.log('API: Creating card for user:', user.id, 'type:', card_type);

    // Check if user already has this card type
    const { data: existingCards, error: checkError } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('card_type', card_type)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing cards:', checkError);
    }

    if (existingCards && existingCards.length > 0) {
      console.log('API: User already has a', card_type, 'card');
      return NextResponse.json(
        {
          error: `You already have a ${card_type} card. Each user can request only 1 debit, 1 credit, and 1 prepaid card.`,
        },
        { status: 400 }
      );
    }

    // Create new card (card details auto-generated by trigger)
    const { data: newCard, error: insertError } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
        card_type,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating card:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('API: Created new card:', newCard);

    // Create alert for card creation
    const { error: alertError } = await supabase.from('alerts').insert({
      user_id: user.id,
      type: 'general',
      title: 'New card requested',
      message: `Your physical ${card_type} card has been requested and will be shipped to your address within 5-7 business days.`,
      severity: 'success',
      is_read: false,
    });

    if (alertError) {
      console.error('Error creating alert:', alertError);
    } else {
      console.log('API: Alert created for card request');
    }

    // Send email notification
    try {
      console.log('📧 Fetching user data for card request email...');

      // Fetch user basic info from bank_users
      const { data: userData, error: userError } = await supabase
        .from('bank_users')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ Error fetching user data:', userError);
      } else if (userData) {
        console.log('📧 User data fetched:', {
          email: userData.email,
          name: userData.full_name,
        });

        // Fetch address from kyc_submissions (address is stored there, not in bank_users)
        console.log('📧 Fetching address from kyc_submissions...');
        const { data: kycData } = await supabase
          .from('kyc_submissions')
          .select('address')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single();

        const deliveryAddress = kycData?.address || 'Your registered address';
        console.log('📧 Delivery address:', deliveryAddress);

        const emailPayload = {
          email: userData.email,
          userName: userData.full_name,
          cardType: card_type,
          deliveryAddress: deliveryAddress,
        };

        console.log(
          '📧 Sending card request email with payload:',
          emailPayload
        );

        // Use relative URL for internal API calls (works in Next.js)
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        console.log('📧 Using base URL:', baseUrl);

        const emailResponse = await fetch(
          `${baseUrl}/api/emails/card-request`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          }
        );

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('❌ Card request email API error:', {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            error: errorText,
          });
        } else {
          const responseData = await emailResponse.json();
          console.log('✅ Card request email sent successfully:', responseData);
        }
      } else {
        console.error('❌ No user data found for email notification');
      }
    } catch (emailError) {
      console.error('❌ Failed to send card request email:', emailError);
    }

    return NextResponse.json({ card: newCard });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
