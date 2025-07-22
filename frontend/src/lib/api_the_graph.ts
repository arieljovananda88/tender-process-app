import axios from "axios";
import { AccessRequest, ParticipantResponse, Tender, KeyResponse } from "./types";

export async function getTenderById(id: string): Promise<Tender> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createTenderByIDQuery(id),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.tenderCreateds[0];
    
  }

export async function getPendingParticipants(id: string): Promise<ParticipantResponse[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createPendingParticipantQuery(id),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.pendingParticipantAddeds;
}

export async function getTenders(search: string = "", page: number = 0, pageSize: number = 10): Promise<Tender[]> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createTenderQuery(search, page, pageSize),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.tenderCreateds;
  }
  
  export async function getTendersLength(search: string = ""): Promise<number> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createTenderLengthQuery(search),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.tenderCreateds.length;
  }
  
  export async function getRegisteredTenders(participant: string, search: string = "", page: number = 0, pageSize: number = 10): Promise<Tender[]> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createRegisteredTenderQuery(participant, search, page, pageSize),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.joinedTenders;
  }
  
  export async function getRegisteredTendersLength(participant: string, search: string = ""): Promise<number> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createRegisteredTenderLengthQuery(participant, search),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.joinedTenders.length;
  }
  
  export async function getMyTenders(address: string, search: string = "", page: number = 0, pageSize: number = 10): Promise<Tender[]> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createMyTenderQuery(address, search, page, pageSize),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.tenderCreateds;
  }
  
  export async function getMyTendersLength(address: string, search: string = ""): Promise<number> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createMyTenderLengthQuery(address, search),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.tenderCreateds.length;
  }
  
  export async function getKey(address: string, cid: string): Promise<KeyResponse> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API,
      {
        query: createKeyQuery(address, cid),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.emitKeys[0];
  }

export async function getParticipants(id: string): Promise<ParticipantResponse[]> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createParticipantQuery(id),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.participantAddeds;
  }

  export async function getAccessRequests(search: string = "", page: number = 0, pageSize: number = 10, requester: string = ""): Promise<AccessRequest[]> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API,
      {
        query: createAccessRequestsQuery(search, page, pageSize, requester),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.requestAccesses;
  }
  
  export async function getAccessRequestsLength(search: string = "", requester: string = ""): Promise<number> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API,
      {
        query: createAccessRequestsLengthQuery(search, requester),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.requestAccesses.length;
  }
  
  export async function getAccessRequestsToMe(search: string = "", page: number = 0, pageSize: number = 10, receiver: string = ""): Promise<AccessRequest[]> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API,
      {
        query: createAccessRequestsToMeQuery(search, page, pageSize, receiver),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API}`
        }
      }
    )
    return response.data.data.requestAccesses;
  }
  
  export async function getAccessRequestsToMeLength(search: string = "", receiver: string = ""): Promise<number> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API,
      {
        query: createAccessRequestsToMeLengthQuery(search, receiver),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API}`
        }
      }
    )
    return response.data.data.requestAccesses.length;
  }

  export async function getDocumentsOfTenderContestant(address: string): Promise<any> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createTenderDocumentsContestantQuery(address),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.documentUploadeds;
    
  }

  export async function getDocumentByCids(cids: string[]): Promise<any> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_DOCUMENT_STORE_API,
      {
        query: createDocumentByCidsQuery(cids),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.documentUploadeds;
    
  }

  export async function getTenderKey(address: string): Promise<any> {
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_ACCESS_MANAGER_API,
      {
        query: createTenderKeyOfTenderContestantQuery(address),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.emitTenderKeys;
    
  }

  const createDocumentByCidsQuery = (cids: string[]) => {
    let condition = ""
    for (const cid of cids) {
      condition += `{documentCid: "${cid}"},`
    }
    return `
      query Subgraphs {
       documentUploadeds(where: {or: [${condition}]}) {
            id
            tenderId
            contestant
            documentCid
            participantName
            participantEmail
            documentFormat
            documentName
            receiver
            submissionDate
        }
      }
    `
  }

  const createTenderKeyOfTenderContestantQuery = (contestant: string) => {
    return `
      query Subgraphs {
       emitTenderKeys(where: {receiver: "${contestant}"}) {
            id
            receiver
            sender
            encryptedKey
            cid
            tenderId
            iv
        }
      }
    `
  }
  

  const createTenderDocumentsContestantQuery = (contestant: string) => {
    return `
      query Subgraphs {
        documentUploadeds(where:{contestant: "${contestant}"}) {
            tenderId
            contestant
            documentCid
            participantName
            participantEmail
            documentFormat
            documentName
            submissionDate
        }
      }
    `
  }

  
  const createTenderQuery = (search: string = "", page: number = 0, pageSize: number = 10) => {
    let condition = ""
    if (search) {
      condition = `where: {name_contains: "${search}" }`
    }
    const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
    return `
      query Subgraphs {
        tenderCreateds(${pagination}, ${condition}) {
          id
          tenderId
          owner
          name
          startDate
          endDate
        }
      }
    `
  }
  
  const createTenderLengthQuery = (search: string = "") => {
    let condition = ""
    if (search) {
      condition = `(where: { name_contains: "${search}" })`
    }
  
    return `
      query Subgraphs {
        tenderCreateds${condition} {
          id
        }
      }
    `;
  };
  
  
  const createMyTenderQuery = (address: string, search: string = "", page: number = 0, pageSize: number = 10) => {
    let condition = ""
    if (address) {
      condition = `where: {owner: "${address}" }`
    }
    if (search) {
      condition = `where: {owner: "${address}", name_contains: "${search}" }`
    }
    const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
    return `
      query Subgraphs {
        tenderCreateds(${pagination}, ${condition}) {
          id
          tenderId
          owner
          name
          startDate
          endDate
        }
      }
    `
  }
  
  const createMyTenderLengthQuery = (address: string, search: string = "") => {
    let condition = ""
    if (address) {
      condition = `where: {owner: "${address}" }`
    }
    if (search) {
      condition = `where: {owner: "${address}", name_contains: "${search}" }`
    }
    return `
      query Subgraphs {
        tenderCreateds(${condition}) {
          id
        }
      }
    `
  }
  
  const createTenderByIDQuery = (id: string) => {
    return `
      query Subgraphs {
        tenderCreateds(where: {tenderId: "${id}"}) {
          id
          tenderId
          owner
          name
          startDate
          endDate
        }
      }
    `
  }
  const createPendingParticipantQuery = (id: string) => {
    return `
    query Subgraphs {
      pendingParticipantAddeds(
        where: { tenderId: "${id}" }
      ) {
        participant
        name
      }
    }
  `;
  }
  
  const createParticipantQuery = (id: string) => {
    return `
    query Subgraphs {
      participantAddeds(
        where: { tenderId: "${id}" }
      ) {
        participant
        name
      }
    }
  `;
  }
  
  const createKeyQuery = (address: string, cid: string) => {
    return `
      query Subgraphs {
        emitKeys(where: {receiver: "${address}", cid: "${cid}"}) {
          encryptedKey
          iv
        }
      }
    `
  }
  
  const createAccessRequestsQuery = (search: string = "", page: number = 0, pageSize: number = 10, requester: string = "") => {
    let condition = ""
    if (requester) {
      condition = `where: {requester: "${requester}" }`
    }
    if (search) {
      condition = `where: {requester: "${requester}", documentName_contains: "${search}" }`
    }
    const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
    return `
      query Subgraphs {
        requestAccesses(${pagination}, ${condition}) {
          id
          requester
          receiver
          cid
          documentName
          documentFormat
          tenderId
          blockTimestamp
        }
      }
    `
  }
  
  const createAccessRequestsLengthQuery = (search: string = "", requester: string = "") => {
    let condition = ""
    if (requester) {
      condition = `where: {requester: "${requester}" }`
    }
    if (search) {
      condition = `where: {requester: "${requester}", documentName_contains: "${search}" }`
    }
  
    return `
      query Subgraphs {
        requestAccesses(${condition}) {
          id
          requester
          receiver
          cid
          documentName
          documentFormat
          tenderId
          blockTimestamp
        }
      }
    `;
  };
  
  const createAccessRequestsToMeQuery = (search: string = "", page: number = 0, pageSize: number = 10, receiver: string = "") => {
    let condition = ""
    if (receiver) {
      condition = `where: {receiver: "${receiver}" }`
    }
    if (search) {
      condition = `where: {receiver: "${receiver}", documentName_contains: "${search}" }`
    }
    const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
    return `
      query Subgraphs {
        requestAccesses(${pagination}, ${condition}) {
          id
          requester
          receiver
          cid
          documentName
          documentFormat
          tenderId
          blockTimestamp
        }
      }
    `
  }
  
  const createAccessRequestsToMeLengthQuery = (search: string = "", receiver: string = "") => {
    let condition = ""
    if (receiver) {
      condition = `where: {receiver: "${receiver}" }`
    }
    if (search) {
      condition = `where: {receiver: "${receiver}", documentName_contains: "${search}" }`
    }
  
    return `
      query Subgraphs {
        requestAccesses(${condition}) {
          id
          requester
          receiver
          cid
          documentName
          documentFormat
          tenderId
          blockTimestamp
        }
      }
    `;
  };
  
  const createRegisteredTenderQuery = (address: string, search: string = "", page: number = 0, pageSize: number = 10) => {
    let condition = ""
    if (address) {
      condition = `where: {participant: "${address}" }`
    }
    if (search) {
      condition = `where: {participant: "${address}", name_contains: "${search}" }`
    }
    const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
    return `
      query Subgraphs {
        joinedTenders(${pagination}, ${condition}) {
          id
          participant
          tenderId
          owner
          name
          startDate
          endDate
        }
      }
    `
  }
  
  const createRegisteredTenderLengthQuery = (address: string, search: string = "") => {
    let condition = ""
    if (address) {
      condition = `where: {owner: "${address}" }`
    }
    if (search) {
      condition = `where: {owner: "${address}", name_contains: "${search}" }`
    }
    return `
      query Subgraphs {
        joinedTenders(${condition}) {
          id
        }
      }
    `
  }