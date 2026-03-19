export function checkExpiryAlert(date){

    if(!date) return false;
    
    const today = new Date();
    const expiry = new Date(date);
    
    const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);
    
    if(diffDays <= 7) return "urgent";
    
    if(diffDays <= 30) return "warning";
    
    return false;
    
    }
    