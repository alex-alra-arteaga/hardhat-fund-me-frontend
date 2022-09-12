//don't use require, doesn't work in the frontend, better to use ES6
//in a future we'll add it with "yarn add ethers", with NodeJS
import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

//target id to run the function onclick
const connectButton = document.getElementById("connectButton")
const withdrawButton = document.getElementById("withdrawButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
connectButton.onclick = connect
withdrawButton.onclick = withdraw
fundButton.onclick = fund
balanceButton.onclick = getBalance

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" })
    } catch (error) {
      console.log(error)
    }
    connectButton.innerHTML = "Connected"
    const accounts = await ethereum.request({ method: "eth_accounts" })
    console.log(accounts)
  } else {
    connectButton.innerHTML = "Please install MetaMask"
  }
}

async function withdraw() {
  console.log(`Withdrawing...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.withdraw()
      await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
      console.log(error)
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask"
  }
}

async function fund() {
  //grab the inputbox value
  const ethAmount = document.getElementById("ethAmount").value
  console.log(`Funding with ${ethAmount}...`)
  if (typeof window.ethereum !== "undefined") {
    //to send a transaction you always need a:
    ////provider / connection to the blockchain
    ////signer / wallet /someone with some gas
    ////contract that we are interacting with
    ////^ABI & Address

    //this line looks at our Metamask, finds the HTTP endpoint and assigns it to "provider"
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    //returns whatever wallet is connected from the provider (Metamask)
    const signer = provider.getSigner()
    //for getting the contract we need the ABI and the address
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      //wait for the tx to be mined
      //listen for an event <- we haven't learned about yet!
      await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
      console.log(error)
    }
  } else {
    fundButton.innerHTML = "Please install MetaMask"
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const balance = await provider.getBalance(contractAddress)
      //formatEther makes Ethereum formated number easier to read
      console.log(ethers.utils.formatEther(balance))
    } catch (error) {
      console.log(error)
    }
  } else {
    balanceButton.innerHTML = "Please install MetaMask"
  }
}
//we'll await for our fund function 
function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`)
  //a promise takes the function itself as an input parameter
  //if promise works correctly, call resolve(), if not, reject, which in this case would be a timeOut
  //basically, once the listener finishes listening, it's going to resolve, if it takes so long, it screws it
  return new Promise((resolve, reject) => {  
    //listen for our tx to finish
    //when it gets the transaction hash, gives as an input parameter to our listener function, the transactionReceipt
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(                          //listener function^
        `Completed with ${transactionReceipt.confirmations} confirmations. `
      )
      //make this function return a promise so it doesn't enter an event loop, wrap it around a promise
      resolve()
    })
  })
}
