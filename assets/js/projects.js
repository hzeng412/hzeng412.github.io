/* Shared project card + detail-modal rendering.
   Usage: initProjects('grid-id', ['id1','id2'] | null) — null renders all. */
var projectsData = null;

async function initProjects(gridId, featuredIds) {
  var grid = document.getElementById(gridId);
  try {
    var response = await fetch('./assets/data/projects.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    projectsData = await response.json();
    var list = featuredIds
      ? projectsData.projects.filter(function (p) { return featuredIds.indexOf(p.id) !== -1; })
      : projectsData.projects;
    renderProjects(grid, list);
  } catch (error) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--ink-soft)">' +
      'Error loading projects: ' + error.message + '</p>';
  }
}

function renderProjects(grid, list) {
  grid.innerHTML = list.map(function (project) {
    return (
      '<article class="pcard" role="button" tabindex="0" ' +
        'aria-label="Open project: ' + project.shortTitle + '" ' +
        'data-project-id="' + project.id + '">' +
        '<div class="pimg"><img src="' + project.image + '" alt="' + project.title + '" loading="lazy"></div>' +
        '<div class="pbody">' +
          '<span class="cat">' + project.shortCategory + '</span>' +
          '<h3>' + project.shortTitle + '</h3>' +
          '<p>' + project.shortDescription + '</p>' +
          '<span class="read-more">Read more</span>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  grid.querySelectorAll('.pcard').forEach(function (card) {
    card.addEventListener('click', function () {
      showProjectDetails(card.dataset.projectId);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showProjectDetails(card.dataset.projectId);
      }
    });
  });
}

function showProjectDetails(projectId) {
  var project = projectsData.projects.find(function (p) { return p.id === projectId; });
  if (!project) return;

  var content =
    '<div class="modal-top">' +
      '<h1>' + project.title + '</h1>' +
      '<button class="modal-close" onclick="closeProjectModal()" aria-label="Close">✕</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="meta">' + project.date + ' — ' + project.category + '</div>' +
      '<div class="msec">' +
        '<div class="msec-head">Overview</div>' +
        '<div class="overview-grid">' +
          '<p>' + project.overview + '</p>' +
          '<img src="' + project.image + '" alt="' + project.title + '">' +
        '</div>' +
      '</div>' +
      '<div class="msec">' +
        '<div class="msec-head">Technical implementation</div>' +
        project.technical.map(function (section) {
          return '<div class="tech-block"><h3>' + section.title + '</h3><ul>' +
            section.points.map(function (pt) { return '<li>' + pt + '</li>'; }).join('') +
            '</ul></div>';
        }).join('') +
      '</div>' +
      '<div class="msec">' +
        '<div class="msec-head">Impact</div>' +
        '<ul>' + project.impact.map(function (pt) { return '<li>' + pt + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="msec">' +
        '<div class="msec-head">Technologies</div>' +
        '<div class="chips">' +
          project.technologies.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('project-content').innerHTML = content;
  var overlay = document.getElementById('project-modal');
  overlay.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.modal-panel').scrollTop = 0;
}

function closeProjectModal() {
  document.getElementById('project-modal').classList.remove('modal-active');
  document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'project-modal') closeProjectModal();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeProjectModal();
});
