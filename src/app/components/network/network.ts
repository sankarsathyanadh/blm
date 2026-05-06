import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, UserData } from '../../services/user';
import { OrganizationChartNodeSelectEvent } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';


@Component({
  selector: 'app-network',
  templateUrl: './network.html',
  styleUrls: ['./network.css'],
  standalone: true,
  imports: [
    CommonModule, 
    OrganizationChartModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
 

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkComponent {
   visible = false;

    showDialog() {
        this.visible = true;
    }
  userService = inject(UserService);
  private fb = inject(FormBuilder);

  displayDetails = false;
  displayAdd = false;
  selectedUser = signal<UserData | null>(null);

  userForm = this.fb.group({
    name: ['', Validators.required],
    memberNumber: ['', Validators.required],
    agentCode: ['', Validators.required]
  });

  // onNodeSelect(event: { node: { data: UserData } }) {
  //   if (event.node && event.node.data) {
  //     this.selectedUser.set(event.node.data);
  //     this.displayDetails = true;
  //   }
  // }
  
 onNodeSelect(event: OrganizationChartNodeSelectEvent) {
  const node = event.node as TreeNode<UserData>;
  if (node?.data) {
    this.selectedUser.set(node.data);
    this.displayDetails = true;
  }
}

  showAddDialog() {
    this.userForm.reset();
    this.displayAdd = true;
  }

  onSaveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const newUser: UserData = {
        name: formValue.name!,
        memberNumber: formValue.memberNumber!,
        agentCode: formValue.agentCode!,
        role: 'Agent',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      
      this.userService.addUser(newUser);
      this.displayAdd = false;
    }
  }
  
}
