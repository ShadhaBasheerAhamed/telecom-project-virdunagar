// Mock Firebase configuration for development
// In a real app, this would contain actual Firebase config

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
    getDocs: async () => ({
      size: 0,
      docs: []
    })
  };
};

export const getDocs = async (query: any) => {
  return { size: 0, docs: [] };
};

export const query = (collection: any, ...conditions: any[]) => {
  return collection;
};

export const where = (field: string, operator: string, value: any) => {
  return {};
};

export const orderBy = (field: string, direction?: string) => {
  return {};
};

export const limit = (count: number) => {
  return {};
};