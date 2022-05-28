import {Contract} from 'near-api-js'
import {populateSales} from "./saleHandling.js"
import {clearContentBody, provokeLogin} from "./utils.js"

export async function createDOM(e) {

	let contract = e.target.contract;

	let contract_metadata = await contract.nft_metadata();

	let main_container=document.createElement("div")
	provokeLogin(main_container, "Please Log In with your NEAR Wallet");
	
	let container=document.createElement("div")
	container.innerHTML=`<h1>Available Sales from ${contract_metadata.name}</h1>
						<div id='sales_container'></div>`
	container.id='sales';
	container.classList.add('page_style')

    main_container.append(container)
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(main_container, footer)

	populateItems(contract)
}

// Think of a way to implement paging as well, next step for sure

async function populateItems(contract) {
	let sales_content = document.getElementById('sales_container');
	populateSales(sales_content, contract);
}
