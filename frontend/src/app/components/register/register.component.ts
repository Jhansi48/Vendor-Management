import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  success = false;
  error = '';
  showPassword = false;

  roles = [
    'Administrator',
    'Procurement Manager',
    'Supply Chain Manager',
    'Finance Officer',
    'Auditor',
    'Vendor'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      full_name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['Vendor', Validators.required],
      vendor_name: ['']
    });

    // Handle vendor name validation conditionally based on role selection
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      const vendorNameCtrl = this.registerForm.get('vendor_name');
      if (role === 'Vendor') {
        vendorNameCtrl?.setValidators([Validators.required]);
      } else {
        vendorNameCtrl?.clearValidators();
      }
      vendorNameCtrl?.updateValueAndValidity();
    });

    // Trigger initial evaluation
    this.registerForm.get('role')?.setValue('Vendor');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      username: this.registerForm.value.username?.trim(),
      email: this.registerForm.value.email?.trim(),
      full_name: this.registerForm.value.full_name?.trim(),
      password: this.registerForm.value.password,
      role: this.registerForm.value.role,
      vendor_name: this.registerForm.value.vendor_name ? this.registerForm.value.vendor_name.trim() : null
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.detail || 'Registration failed. Username or email might be taken.';
      }
    });
  }
}
