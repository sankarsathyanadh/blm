import { Injectable, signal } from '@angular/core';
import { TreeNode } from 'primeng/api';

export interface UserData {
  name: string;
  memberNumber: string;
  agentCode: string;
  role: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private initialData: TreeNode[] = [
    {
      label: 'Root User',
      expanded: true,
      type: 'person',
      data: {
        name: 'John Doe',
        memberNumber: 'M001',
        agentCode: 'A100',
        role: 'CEO',
        joinDate: '2023-01-01',
        status: 'Active'
      },
      children: [
        {
          label: 'Manager A',
          expanded: true,
          type: 'person',
          data: {
            name: 'Alice Smith',
            memberNumber: 'M002',
            agentCode: 'A101',
            role: 'Manager',
            joinDate: '2023-02-15',
            status: 'Active'
          },
          children: [
            {
              label: 'Agent 1',
              expanded: false,
              type: 'person',
              data: {
                name: 'Bob Wilson',
                memberNumber: 'M004',
                agentCode: 'A103',
                role: 'Agent',
                joinDate: '2023-05-10',
                status: 'Active'
              },
               children: [
            {
              label: 'Agent 1',
              type: 'person',
              data: {
                name: 'Bob Wilson',
                memberNumber: 'M004',
                agentCode: 'A103',
                role: 'Agent',
                joinDate: '2023-05-10',
                status: 'Active'
              }
            },
            {
              label: 'Agent 2',
              type: 'person',
              data: {
                name: 'Charlie Brown',
                memberNumber: 'M005',
                agentCode: 'A104',
                role: 'Agent',
                joinDate: '2023-06-12',
                status: 'Inactive'
              }
            }
          ]
            },
            {
              label: 'Agent 2',
              type: 'person',
              data: {
                name: 'Charlie Baba',
                memberNumber: 'M005',
                agentCode: 'A104',
                role: 'Agent',
                joinDate: '2023-06-12',
                status: 'Inactive'
              }
            }
          ]
        },
        {
          label: 'Manager B',
          expanded: true,
          type: 'person',
          data: {
            name: 'David Miller',
            memberNumber: 'M003',
            agentCode: 'A102',
            role: 'Manager',
            joinDate: '2023-03-20',
            status: 'Active'
          },
          children: [
            {
              label: 'Agent 3',
              type: 'person',
              data: {
                name: 'Eve Davis',
                memberNumber: 'M006',
                agentCode: 'A105',
                role: 'Agent',
                joinDate: '2023-07-01',
                status: 'Active'
              },
               children: [
            {
              label: 'Agent sub',
              type: 'person',
              data: {
                name: 'Eve Donald',
                memberNumber: 'M008',
                agentCode: 'A10',
                role: 'Agent',
                joinDate: '2023-07-01',
                status: 'Active'
              }
            }
          ]
            }
          ]
        }
      ]
    }
  ];

  networkData = signal<TreeNode[]>(this.initialData);

  // Computed signal for flattened user list
  users = () => {
    const flattened: UserData[] = [];
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.data) flattened.push(node.data as UserData);
        if (node.children) traverse(node.children);
      });
    };
    traverse(this.networkData());
    return flattened;
  };
  addUser(newUser: UserData) {
    const currentData = [...this.networkData()];
    // For simplicity, we add to the first child of root if it exists
    if (currentData[0].children) {
        currentData[0].children.push({
            label: newUser.name,
            type: 'person',
            data: newUser
        });
    }
    this.networkData.set(currentData);
  }
  
}
