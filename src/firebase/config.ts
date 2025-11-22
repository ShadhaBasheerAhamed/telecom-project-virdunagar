// Mock Firebase configuration for development
// In a real app, this would contain actual Firebase config

// Mock document reference
export const doc = (db: any, collection: string, id: string) => ({
  id,
  collection,
  get: async () => ({ data: () => ({}), id }),
  update: async (data: any) => console.log('Mock update:', id, data),
  delete: async () => console.log('Mock delete:', id)
});

// Mock document reference for add operation
export const docRef = {
  id: `mock-${Date.now()}`,
  collection: '',
  get: async () => ({ data: () => ({}), id: '' }),
  update: async (data: any) => console.log('Mock add:', data),
  delete: async () => console.log('Mock delete')
};

export const db = {
  collection: () => ({
    where: () => ({
      orderBy: () => ({
        getDocs: async () => ({
          size: 0,
          docs: []
        })
      }),
      getDocs: async () => ({
        size: 0,
        docs: []
      })
    }),
    addDoc: async (data: any) => {
      console.log('Mock addDoc:', data);
      return { id: `mock-${Date.now()}`, ...data };
    },
    getDocs: async () => ({
      size: 0,
      docs: []
    })
  })
};

export const collection = (db: any, name: string) => {
  return {
    where: (field: string, operator: string, value: any) => {
      return {
        orderBy: (orderField: string) => {
          return {
            getDocs: async () => ({
              size: 0,
              docs: []
            })
          }
        },
        getDocs: async () => ({
          size: 0,
          docs: []
        })
      }
    },
    addDoc: async (data: any) => {
      console.log('Mock addDoc:', data);
      return { id: `mock-${Date.now()}`, ...data };
    },
    getDocs: async () => ({
      size: 0,
      docs: []
    })
  };
};

// Mock Firebase operations
export const addDoc = async (collectionRef: any, data: any) => {
  console.log('Mock addDoc:', data);
  return { id: `mock-${Date.now()}`, ...data };
};

export const updateDoc = async (docRef: any, data: any) => {
  console.log('Mock updateDoc:', data);
  return { ...docRef, ...data };
};

export const deleteDoc = async (docRef: any) => {
  console.log('Mock deleteDoc:', docRef.id);
  return true;
};

export const getDocs = async (query: any) => {
  console.log('Mock getDocs:', query);
  return { 
    size: 0, 
    docs: [],
    forEach: (callback: (doc: any) => void) => {
      // No docs in mock
    }
  };
};

export const query = (collection: any, ...conditions: any[]) => {
  return { 
    collection, 
    conditions,
    getDocs: async () => ({
      size: 0,
      docs: []
    })
  };
};

export const where = (field: string, operator: string, value: any) => {
  return { field, operator, value };
};

export const orderBy = (field: string, direction?: string) => {
  return { field, direction: direction || 'asc' };
};

export const limit = (count: number) => {
  return { limit: count };
};