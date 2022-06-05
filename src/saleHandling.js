import {Contract} from 'near-api-js'

export async function populateSales(sales_container, index=0){
	
	try{

		let limit;
		if(sales_container.classList.contains('standAlone')){
			limit = 9
		}
		else{
			limit = 6
		}

		let sales=await window.marketplace_contract.get_sales({ from_index: index.toString(), limit }); 

		let token_ids=sales.map(sale=>sale.token_id);
		let contracts = sales.map(sale=>sale.nft_contract_id);

		let tokens=[];
		for(let i=0;i<token_ids.length;i++){
			let contract = await new Contract(window.walletConnection.account(), contracts[i], {
			    viewMethods: ['nft_metadata', 'nft_total_supply', 'nft_tokens_for_owner', 'nft_token'],
			    changeMethods: ['nft_mint', 'nft_transfer', 'nft_approve', 'nft_revoke'],
			})
			let token=await contract.nft_token({'token_id': token_ids[i]})
			const contract_metadata = await contract.nft_metadata();
			const base_uri = contract_metadata.base_uri;
			Object.assign(token, {base_uri});
			tokens.push(token);
		}
		
		createSalesDOM(sales_container, sales, tokens);

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

function createSalesDOM(container, sales, tokens){
	container.id="items"
	container.classList.add('tokens');

	if (sales.length==0){
		container.textContent="No sales found!"
		return container;
	}

	for(let i=0;i<sales.length;i+=1){
		container.appendChild(createSaleFromObject(sales[i], tokens[i]))
	}
}

function createSaleFromObject(sale, token){

	// Finding media 
	let media = token.metadata.media;

	if(token.base_uri){
		media = token.base_uri + '/' + token.metadata.media;
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