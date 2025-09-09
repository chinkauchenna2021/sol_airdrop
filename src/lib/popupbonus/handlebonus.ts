export async function claimTwitterBonus() {
  try {
    const response = await fetch('/api/popups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies/session
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Bonus claimed successfully:', data.message);
      return data;
    } else {
      console.error('Failed to claim bonus:', data.error);
      throw new Error(data.error || 'Failed to claim bonus');
    }
  } catch (error) {
    console.error('Error claiming bonus:', error);
    throw error;
  }
}




export async function checkBonusStatus(userId:string) {
  try {
    const response = await fetch('/api/popups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies/session
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Bonus status:', data.userBonusDtatus);
      return data;
    } else {
      console.error('Failed to check bonus status:', data.error);
      throw new Error(data.error || 'Failed to check bonus status');
    }
  } catch (error) {
    console.error('Error checking bonus status:', error);
    throw error;
  }
}

