export async function populateSales(sales_container, contract){
	
	try{
		let all_sales=await window.marketplace_contract.get_sales_by_nft_contract_id({'nft_contract_id':contract.contractId,'limit':40}); //Contract id mentioned explicitly
		
		//Filtered out the ones that are auctions
		let sales= all_sales.filter( sale=>!sale["is_auction"] )
		let token_ids=sales.map(sale=>sale.token_id);

		let tokens=[];
		for(let i=0;i<token_ids.length;i++){
		  let token=await contract.nft_token({'token_id': token_ids[i]})
		  tokens.push(token);
		}
		
		const contract_metadata = await contract.nft_metadata();
		const base_uri = contract_metadata.base_uri;
		
		createSalesDOM(sales_container, sales, tokens, base_uri);

	}
	catch(e){
		alert(
		  'Something went wrong! ' +
		  'Maybe you need to sign out and back in? ' +
		  'Check your browser console for more info.'
		)
	throw e
	}    
}

function createSalesDOM(container, sales, tokens, base_uri){
	container.id="items"
	container.classList.add('tokens');

	if (sales.length==0){
		container.textContent="No sales found!"
		return container;
	}

	for(let i=0;i<sales.length;i+=1){
		container.appendChild(createSaleFromObject(sales[i], tokens[i], base_uri))
	}
}

function createSaleFromObject(sale, token, base_uri){

	// Finding media 
	let media = token.metadata.media;

	if(base_uri){
		media = base_uri + '/' + token.metadata.media;
	}

	let saleDOM=document.createElement('div')
	saleDOM.id="tokenContainer";
	saleDOM.classList.add('sale_tab_items_bg');
	
	let price_to_display=(sale.price/(10**24)).toFixed(1);

	saleDOM.innerHTML=`<img class ="loading" src="imgs/img_loading.gif">
						<img src=${media} class="token_image hidden" alt='NFT'>
						<div class='item_info'>
							<div class='item_left'>
								<div class='item_owner'>${sale.owner_id}</div>
								<div class='item_bid'>Cost: ${price_to_display} NEAR</div>
							</div>
							<button id="buy_sale">Buy!</button>
						</div>`;

	let [loading_img, img] = saleDOM.querySelectorAll("img")

	img.addEventListener('load', ()=>{
		loading_img.style.display='none';
		img.style.display = 'block'
	});

	img.addEventListener('error', ()=>{
		loading_img.style.display='none';
		img.src = "imgs/failed-to-load.svg"
	});
	
	let button=saleDOM.querySelector('button');
	button.token_id=sale.token_id;
	button.sale=sale;
	button.addEventListener('click', buyListener);

	return saleDOM;
}

function buyListener(e){
	buy(e.target.token_id, e.target.sale)
}

async function buy(token_id, sale){

	if(!window.walletConnection.isSignedIn())
	{	alert('Please Sign In!')
		return;
	}

	if(window.accountId==sale.owner_id){
		alert('Cant buy your own token!');
		return;
	}
	
	//Fixed the bn.js issue by converting number to string instead of exponential form.
	let price=sale.price.toLocaleString('fullwide', {useGrouping:false});

	try{
		await window.marketplace_contract.offer({"nft_contract_id":sale.nft_contract_id, 
		                                          "token_id":token_id},
		                                          "300000000000000",
		                                          price);
	}
	catch(e){
		alert(
		  'Something went wrong! ' +
		  'Maybe you need to sign out and back in? ' +
		  'Check your browser console for more info.'
		)
	throw e
	}
}