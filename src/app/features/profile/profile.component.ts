import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

export interface TechSkill {
    category: string;
    skills: string[];
    icon: string;
}

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent {
    readonly title = signal('Full-Stack Engineer');
    readonly subtitle = signal('Enterprise Angular • Spring Boot • OpenShift Solutions');

    readonly skillCategories = signal<TechSkill[]>([
        {
            category: 'Frontend Excellence',
            skills: ['Angular', 'TypeScript', 'RxJS', 'Signals', 'Tailwind CSS', 'Angular Material'],
            icon: 'code'
        },
        {
            category: 'Backend & Microservices',
            skills: ['Spring Boot', 'Java', 'REST APIs', 'Spring Security', 'Hibernate/JPA'],
            icon: 'dns'
        },
        {
            category: 'Cloud & DevOps',
            skills: ['OpenShift', 'Kubernetes', 'Docker', 'CI/CD Pipelines', 'Helm'],
            icon: 'cloud_queue'
        }
    ]);
}