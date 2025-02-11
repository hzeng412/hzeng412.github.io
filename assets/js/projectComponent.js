// assets/js/projectComponent.js

class ProjectManager {
    constructor() {
        this.projectData = null;
    }

    async loadProjectData() {
        try {
            const response = await fetch('./assets/data/projects.json');
            this.projectData = await response.json();
        } catch (error) {
            console.error('Error loading project data:', error);
        }
    }

    createProjectCard(projectId) {
        const project = this.projectData.projects[projectId];
        if (!project) return null;

        return `
            <div class="card">
                <div class="three-d-container">
                    <div id="${projectId}-3d">
                        <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover" />
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2">${project.shortTitle}</h3>
                    <p class="text-gray-600 mb-4">${project.shortDescription}</p>
                    <a href="project-detail.html?id=${project.id}" class="text-blue-400 hover:text-blue-300">Learn More →</a>
                </div>
            </div>
        `;
    }

    createProjectGrid(containerElement, projectIds) {
        if (!containerElement) return;
        
        const projectsHtml = projectIds
            .map(id => this.createProjectCard(id))
            .filter(card => card !== null)
            .join('');
            
        containerElement.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto max-w-6xl">
                ${projectsHtml}
            </div>
        `;
    }
}

// Create global instance
const projectManager = new ProjectManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await projectManager.loadProjectData();
    
    const projectContainer = document.getElementById('projects-grid');
    if (projectContainer) {
        const allProjects = Object.keys(projectManager.projectData.projects);
        projectManager.createProjectGrid(projectContainer, allProjects);
    }
});