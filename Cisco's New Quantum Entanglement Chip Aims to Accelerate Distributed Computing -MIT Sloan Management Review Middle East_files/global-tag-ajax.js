// Global tag: - Tag support to URL
function uacf7_global_tag_support(event, redirectUrl, target){
    var inputs = event.detail.inputs;
    var nameAarr = [];
    var nameVal = [];
    Object.entries(inputs).forEach(([k,v]) => {
        if(typeof v.value !== 'object' ){
            nameAarr.push('['+v.name+']');
            nameVal.push(v.value);	
        }					  
    }); 
    
    jQuery.ajax({
        url: uacf7_global_tag.ajaxUrl,
        data: {  
            action:'uacf7_global_tag_ajax',
            nameAarr: nameAarr,
            nameVal:nameVal,
            redirect_url:redirectUrl
        },
        type:'post',
        success:function(result){
            if (result) {
                if (!target) {
                    location.href = result;
                } else {
                    window.open(result);
                }
            }

        },
        error:function(error){
                
        }
    })
}